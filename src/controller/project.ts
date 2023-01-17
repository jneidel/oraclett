import { fs, PROJECTS_FILE } from "../config";
import { parseOracleString, getFullNames } from "./utils";
import { readHours, writeHours } from "./hours";
import { readNotes, writeNotes } from "./notes";

export const readProjects = async ( forceReadingFromDisk = false ) => fs.read( PROJECTS_FILE, forceReadingFromDisk );
const writeProjects = async data => fs.write( PROJECTS_FILE, data );

export async function listProjects( projectToFilterBy: string|undefined ) {
  let projectList = await readProjects();
  let projectKeys = Object.keys( projectList );

  if ( projectToFilterBy )
    projectKeys = projectKeys.filter( projectKey => projectKey === projectToFilterBy );


  projectList = await Promise.all( projectKeys.map( async ( projectKey: string ) => {
    const projectName = await getFullNames.project( projectKey, { style: "parens", keyColor: "project" } );
    const taskDetailNames = await Promise.all(
      Object.keys( projectList[projectKey].taskDetails ).sort()
        .map( async taskDetailKey => {
          const name = await getFullNames.taskDetail( projectKey, taskDetailKey, { style: "parens", keyColor: "td" } );
          return `  * ${name}`;
        } )
    ).then( arr => arr.join( "\n" ) );
    return `${projectName}\n${taskDetailNames}`;
  } ) );

  if ( projectList.length !== 0 ) {
    console.log( "Projects:" );
    console.log( projectList.join( "\n" ) );
  } else {
    console.log( `There are no projects.

To add a few use: project add` );
  }
}

export async function addProject( codeString: string, taskDetailsStrings: string[] = [] ) {
  const code: any = parseOracleString( codeString );
  const [ key ] = Object.keys( code );

  const tds = taskDetailsStrings
    .map( td => parseOracleString( td ) )
    .reduce( ( acc, cur ) => Object.assign( acc, cur ), {} );

  code[key].taskDetails = tds;

  const projects = await readProjects();
  if ( projects[key] ) {
    if ( code[key].description )
      projects[key].description = code[key].description;
    projects[key].taskDetails = Object.assign( projects[key].taskDetails, code[key].taskDetails );
    console.log( "Successfully updated" );
  } else {
    projects[key] = code[key];
    console.log( "Sucessfully added" );
  }

  await writeProjects( projects );
  listProjects( key );
}

function findInstancesOfProjectInData( projectKey: string, data: any ): Array<{
  year: string;
  week: string;
}> {
  return Object.keys( data ).reduce( ( acc: any[], year ) => {
    const dataForYear = data[year];

    const result = Object.keys( dataForYear ).reduce( ( acc: any[], week ) => {
      const dataForWeek = dataForYear[week];

      if ( dataForWeek[projectKey] )
        acc.push( { year, week } );

      return acc;
    }, [] );

    return [ ...acc, ...result ];
  }, [] );
}
function findInstancesOfTaskDetailInData( projectKey: string, taskDetailKey: string, data: any ): Array<{
  year: string;
  week: string;
}> {
  return findInstancesOfProjectInData( projectKey, data )
    .filter( instance => !!data[instance.year][instance.week][projectKey][taskDetailKey] );
}

async function removeProjectData( projectKey: string ) {
  const projects = await readProjects();
  delete projects[projectKey];
  writeProjects( projects );

  const [ hours, notes ] = await Promise.all( [ readHours( true ), readNotes( true ) ] );
  const deleteInstance = data => instance => {
    const { year, week } = instance;
    delete data[year][week][projectKey];
  };
  findInstancesOfProjectInData( projectKey, hours ).forEach( deleteInstance( hours ) );
  findInstancesOfProjectInData( projectKey, notes ).forEach( deleteInstance( notes ) );
  writeHours( hours );
  writeNotes( notes );
}
async function removeTaskDetailData( projectKey, taskDetailKey ) {
  const projects = await readProjects();
  delete projects[projectKey].taskDetails[taskDetailKey];
  writeProjects( projects );

  const [ hours, notes ] = await Promise.all( [ readHours( true ), readNotes( true ) ] );
  const deleteInstance = data => instance => {
    const { year, week } = instance;
    delete data[year][week][projectKey][taskDetailKey];
  };
  findInstancesOfTaskDetailInData( projectKey, taskDetailKey, hours ).forEach( deleteInstance( hours ) );
  findInstancesOfTaskDetailInData( projectKey, taskDetailKey, notes ).forEach( deleteInstance( notes ) );
  writeHours( hours );
  writeNotes( notes );
}
export async function removeProject( projectCode: string, taskDetail: string|null = null ) {
  if ( taskDetail === null )
    removeProjectData( projectCode );
  else
    removeProjectData( projectCode );
}

async function editTaskDetailData( projectKey: string, taskDetailKey: string, newTaskDetailObject: any ) {
  const projects = await readProjects();
  projects[projectKey].taskDetails = Object.assign( projects[projectKey].taskDetails, newTaskDetailObject );

  const newTaskDetailKey = Object.keys( newTaskDetailObject )[0];
  const keyHasChanged = taskDetailKey !== newTaskDetailKey;

  if ( keyHasChanged ) {
    delete projects[projectKey].taskDetails[taskDetailKey];

    const [ hours, notes ] = await Promise.all( [ readHours( true ), readNotes( true ) ] );

    const rewriteInstance = data => instance => {
      const { year, week } = instance;
      data[year][week][projectKey][newTaskDetailKey] = data[year][week][projectKey][taskDetailKey];
      delete data[year][week][projectKey][taskDetailKey];
    };
    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, hours ).forEach( rewriteInstance( hours ) );
    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, notes ).forEach( rewriteInstance( notes ) );

    writeHours( hours );
    writeNotes( notes );
  }

  await writeProjects( projects );
}
async function editProjectData( projectKey: string, newProjectObject: any ) {
  let projects = await readProjects();
  const newProjectKey = Object.keys( newProjectObject )[0];
  newProjectObject[newProjectKey].taskDetails = projects[projectKey].taskDetails;
  projects = Object.assign( projects, newProjectObject );

  const keyHasChanged = projectKey !== newProjectKey;

  if ( keyHasChanged ) {
    delete projects[projectKey];

    const [ hours, notes ] = await Promise.all( [ readHours( true ), readNotes( true ) ] );

    const rewriteInstance = data => instance => {
      const { year, week } = instance;
      data[year][week][newProjectKey] = data[year][week][projectKey];
      delete data[year][week][projectKey];
    };
    findInstancesOfProjectInData( projectKey, hours ).forEach( rewriteInstance( hours ) );
    findInstancesOfProjectInData( projectKey, notes ).forEach( rewriteInstance( notes ) );

    writeHours( hours );
    writeNotes( notes );
  }

  await writeProjects( projects );
  return newProjectKey;
}
export async function editProject( data: {project: string; newName: string; taskDetail?: string } ) {
  let { project, newName, taskDetail } = data;
  const newNameObject: any = parseOracleString( newName );

  if ( taskDetail )
    editTaskDetailData( project, taskDetail, newNameObject );
  else
    project = await editProjectData( project, newNameObject );


  listProjects( project );
}
