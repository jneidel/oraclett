
const { Date } = require( "sugar" );
import { readProjects } from "./project";

export function validateDateString( dateString = "today", dontThrow = false ): string|boolean {
  const date = Date.create( dateString );
  const message = `Invalid date string passed.
  Supported are even human readable string like: today, yesterday, tomorrow, fri, last week tue, last wednesday.

  You can interactively test what works here: https://sugarjs.com/dates/#/Parsing`;

  if ( !Date.isValid( date ) ) {
    if ( !dontThrow )
      throw new Error( message );

    return message;
  } else {return true;}
}

export async function validateProject( projectCode: string|undefined ) {
  const projects = await readProjects();

  if ( !( projectCode  && projects[projectCode] ) ) {
    throw new Error( `The project code is invalid.

Check existing with: project list
Add new project using: project add` );
  }
}
export async function validateTaskDetails( projectCode: string|undefined, taskDetails: string|undefined ) {
  const projects = await readProjects();

  if ( !( projectCode && taskDetails && projects[projectCode] && projects[projectCode].taskDetails[taskDetails] ) ) {
    throw new Error( `The combination of project code and task details is invalid (either both or one of them don't exist.)

Check existing with: project list
Add new project using: project add` );
  }
}
