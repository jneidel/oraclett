import chalk from "chalk";
import { readProjects } from "./project";

export function parseOracleString( str: string ) {
  const match = str.match( /(.+) - (.*)/ );
  if ( match )
    return { [match[1]]: { description: match[2] } };
  else
    return { [str]: { description: null } };
}

type FullNameOptions = {
  style?: "parens"|"hyphen";
  keyColor?: string|null;
}
const fullNameOptionsDefaults = {
  style   : "hyphen",
  keyColor: null,
};
export function combineIntoFullName( key: string, description: string|null, options: FullNameOptions = {} ): string {
  const { style, keyColor } = Object.assign( fullNameOptionsDefaults, options );

  const coloredKey = keyColor !== null ? chalk.hex( keyColor )( key ) : key;

  if ( description === null ) {return coloredKey;} else {
    switch ( style ) {
      case "hyphen":
        return `${coloredKey} - ${description}`;
      case "parens":
        return `${coloredKey} (${description})`;
    }
  }
}

async function getFullProjectName( projectKey: string, options: FullNameOptions = {} ): Promise<string> {
  return readProjects()
    .then( res => res[projectKey] )
    .then( project => {
      if ( !project ) {
        throw new Error( `Project by the name of ${projectKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      } else {
        return combineIntoFullName( projectKey, project.description, options );
      }
    } );
}
async function getFullTaskDetailName( projectKey: string, taskDetailKey: string, options: FullNameOptions = {} ): Promise<string> {
  return readProjects()
    .then( res => res[projectKey] )
    .then( project => {
      if ( !project ) {
        throw new Error( `Project by the name of ${projectKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      } else {
        return project;
      }
    } )
    .then( project => project.taskDetails[taskDetailKey] )
    .then( taskDetail => {
      if ( !taskDetail ) {
        throw new Error( `Task detail by the name of ${taskDetailKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      } else {
        return combineIntoFullName( taskDetailKey, taskDetail.description, options );
      }
    } );
}

export const interactiveHelpText = `Passing no arguments will start an interactive session.`;

async function getReadableProjectChoices( selection: String[]|null = null ): Promise<Array<{name: string; value: string}>> {
  const projects = await readProjects();

  return Promise.all( Object.keys( projects )
    .filter( key => {
      if ( selection === null )
        return true;
      else
        return selection.includes( key );
    } )
    .map( async projectKey => {
      const projectName = await getFullProjectName( projectKey, { style: "hyphen" } );
      return {
        name : projectName,
        value: projectKey,
      };
    } ) );
}
async function getReadableTaskDetailChoices( projectCode: string, selection: String[]|null = null ): Promise<Array<{name: string; value: string}>> {
  const projects = await readProjects();

  return Promise.all( Object.keys( projects[projectCode].taskDetails )
    .filter( key => {
      if ( selection === null )
        return true;
      else
        return selection.includes( key );
    } )
    .map( async taskDetailKey => {
      const taskDetailName = await getFullTaskDetailName( projectCode, taskDetailKey, { style: "hyphen" } );
      return {
        name : taskDetailName,
        value: taskDetailKey,
      };
    } ) );
}
export const getReadableChoices = {
  project    : getReadableProjectChoices,
  taskDetails: getReadableTaskDetailChoices,
};
export const getFullNames = {
  project   : getFullProjectName,
  taskDetail: getFullTaskDetailName,
};
