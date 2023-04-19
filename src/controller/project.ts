import { parseOracleString, getFullNames } from "./utils";
import { editProjectData, editTaskDetailData } from "../data/project";
import Project from "../data/project";

const TRUNCATED_LIST_MARKER = "any text here";

export async function listProjects( options: { filter?: string; full?: boolean } = {} ) {
  const { filter, full } = options;

  let projectList = await Project.readAll();
  let projectKeys = Object.keys( projectList ); // most recently updated is the last in the list

  if ( filter )
    projectKeys = projectKeys.filter( projectKey => projectKey === filter );

  projectList = await Promise.all( projectKeys.map( async ( projectKey: string ) => {
    const projectName = await getFullNames.project( projectKey, { style: "parens", colorForWhat: "project" } );
    const taskDetailNames = await Promise.all(
      Object.keys( projectList[projectKey].taskDetails ).sort()
        .map( ( key, index ) => {
          if ( !full && index === 3 )
            return TRUNCATED_LIST_MARKER;
          else
            return key;
        } )
        .map( async taskDetailKey => {
          if ( !full && taskDetailKey === TRUNCATED_LIST_MARKER ) {
            return `  * .. (--full to see all)`;
          } else {
            const name = await getFullNames.taskDetail( projectKey, taskDetailKey, { style: "parens", colorForWhat: "taskDetail" } );
            return `  * ${name}`;
          }
        } )
    ).then( arr => full ? arr : arr.slice( 0, 4 ) )
      .then( arr => arr.join( "\n" ) );
    return `${projectName}\n${taskDetailNames}`;
  } ) );

  if ( projectList.length !== 0 )
    console.log( projectList.join( "\n" ) );
  else
    console.log( `There are no projects.

To add a few use: project add` );
}

export async function addProject( projectString: string, taskDetailsStrings: string[] = [] ) {
  const project: any = parseOracleString( projectString );
  const [ key ] = Object.keys( project );

  const tds = taskDetailsStrings
    .map( td => parseOracleString( td ) )
    .reduce( ( acc, cur ) => Object.assign( acc, cur ), {} );

  project[key].taskDetails = tds;

  const projects = await Project.readAll();
  if ( projects[key] ) {
    if ( project[key].description )
      projects[key].description = project[key].description;
    projects[key].taskDetails = Object.assign( projects[key].taskDetails, project[key].taskDetails );
    console.log( "Successfully updated project" );
  } else {
    projects[key] = project[key];
    console.log( "Successfully added project" );
  }

  await Project.writeAll( projects );
  listProjects( { filter: key } );
}

export async function removeProject( projectCode: string, taskDetail: string|null = null ) {
  if ( taskDetail === null )
    Project.deleteProject( projectCode );
  else
    Project.deleteTaskDetail( projectCode, taskDetail );
}

export async function editProject( data: {project: string; newName: string; taskDetail?: string } ) {
  let { project, newName, taskDetail } = data;
  const newNameObject: any = parseOracleString( newName );

  if ( taskDetail )
    editTaskDetailData( project, taskDetail, newNameObject );
  else
    project = await editProjectData( project, newNameObject );

  listProjects( { filter: project } );
}
