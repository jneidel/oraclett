import fs from "fs/promises";
import chalk from "chalk";
import { PROJECTS_FILE, HOURS_FILE, TASKS_FILE, createDataDir } from ".";

async function readAllProjects() {
  return fs.readFile( PROJECTS_FILE, { encoding: "utf8" } )
    .then( jsonString => JSON.parse( jsonString ) )
    .catch( err => {
      if ( err.code === "ENOENT" ) {
        console.log( "ENOENT" );
        return {};
      } else {
        console.log( err );
        return {};
      }
    } );
}

function parseOracleString( str: string ) {
  const match = str.match( /(.+) - (.*)/ );
  if ( match )
    return { [match[1]]: { description: match[2] } };
  else
    return { str: { description: null } };
}

async function writeProjects( projects ) {
  const jsonString = JSON.stringify( projects, null, 2 );
  await createDataDir();
  await fs.writeFile( PROJECTS_FILE, jsonString );
}
async function listProjects( projectToFilterBy: string|undefined ) {
  let projectList = await projects.readAll();
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
async function addProject( codeString: string, taskDetailsStrings: string[] = [] ) {
  const code = parseOracleString( codeString );
  const [ key ] = Object.keys( code );

  const tds = taskDetailsStrings
    .map( td => parseOracleString( td ) )
    .reduce( ( acc, cur ) => Object.assign( acc, cur ), {} );

  code[key].taskDetails = tds;

  const projects = await readAllProjects();
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

export const projects = {
  readAll: readAllProjects,
  add    : addProject,
  list   : listProjects,
};
