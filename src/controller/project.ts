import chalk from "chalk";
import { fs, PROJECTS_FILE } from "../config";

export const readProjects = async () => fs.read( PROJECTS_FILE );
const writeProjects = async data => fs.write( PROJECTS_FILE, data );

export function parseOracleString( str: string ) {
  const match = str.match( /(.+) - (.*)/ );
  if ( match )
    return { [match[1]]: { description: match[2] } };
  else
    return { str: { description: null } };
}
export function combineToOracleString( key: string, description: string|null ) {
  if ( description === null )
    return key;
  else
    return `${key} - ${description}`;
}

export async function listProjects( projectToFilterBy: string|undefined ) {
  let projectList = await readProjects();
  let projectKeys = Object.keys( projectList );

  if ( projectToFilterBy )
    projectKeys = projectKeys.filter( projectKey => projectKey === projectToFilterBy );


  projectList = projectKeys.map( ( projectKey: string ) => {
    const project = projectList[projectKey];

    const projectCodeString = ` ${chalk.green( projectKey )} (${project.description})`;
    const taskDetailsString = Object.keys( project.taskDetails ).sort()
      .map( taskDetailKey => {
        const { description } = project.taskDetails[taskDetailKey];
        return `  * ${chalk.blue( taskDetailKey )} (${description})`;
      } ).join( "\n" );
    return `${projectCodeString  }\n${  taskDetailsString}`;
  } );

  if ( projectList.length !== 0 ) {
    console.log( "Projects:" );
    console.log( projectList.join( "\n" ) );
  } else {
    console.log( "There are no projects.\nTo add use: $ oraclett project add" );
  }
}

export async function addProject( codeString: string, taskDetailsStrings: string[] = [] ) {
  const code = parseOracleString( codeString );
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

export async function removeProject( projectCode: string, taskDetail: string|null = null ) {
  const projects = await readProjects();

  if ( taskDetail === null )
    delete projects[projectCode];
  else
    delete projects[projectCode].taskDetails[taskDetail];

  writeProjects( projects );
}


export async function editProject( data: {project: string; newName: string; taskDetail?: string } ) {
  let projects = await readProjects();
  let { project, newName, taskDetail } = data;
  const newNameObject: any = parseOracleString( newName );

  if ( taskDetail ) {
    taskDetail = Object.keys( parseOracleString( taskDetail ) )[0];
    projects[project].taskDetails = Object.assign( projects[project].taskDetails, newNameObject );
    delete projects[project].taskDetails[taskDetail];
  } else {
    const projectCode = Object.keys( newNameObject )[0];
    newNameObject[projectCode].taskDetails = projects[project].taskDetails;
    projects = Object.assign( projects, newNameObject );
    delete projects[project];
    project = projectCode;
  }

  await writeProjects( projects );
  listProjects( project );
}
