import { readProjects } from "./project";

export function parseOracleString( str: string ) {
  const match = str.match( /(.+) - (.*)/ );
  if ( match )
    return { [match[1]]: { description: match[2] } };
  else
    return { [str]: { description: null } };
}
export function combineToOracleString( key: string, description: string|null ) {
  if ( description === null )
    return key;
  else
    return `${key} - ${description}`;
}

export const interactiveHelpText = `Passing no arguments will start an interactive session.`;

async function getReadableProjectChoices() {
  const projects = await readProjects();

  return Object.keys( projects ).map( key => {
    const project = key;
    const projectDescription = projects[key].description;
    return {
      name : combineToOracleString( project, projectDescription ),
      value: project,
    };
  } );
}
async function getReadableTaskDetailChoices( projectCode: string ) {
  const projects = await readProjects();

  return Object.keys( projects[projectCode].taskDetails ).map( key => {
    const taskDetail = key;
    const taskDetailDescription = projects[projectCode].taskDetails[key].description;
    return {
      name : combineToOracleString( taskDetail, taskDetailDescription ),
      value: taskDetail,
    };
  } );
}
export const getReadableChoices = {
  project    : getReadableProjectChoices,
  taskDetails: getReadableTaskDetailChoices,
};
