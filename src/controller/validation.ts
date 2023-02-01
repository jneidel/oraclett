
const { Date } = require( "sugar" );
import { readProjects } from "./project";

export function validateDateString( dateString: string, dontThrow = false ): string|boolean {
  const date = Date.create( dateString );
  const message = `Invalid date passed.

Natural language dates like these supported:
  today, yesterday, tomorrow, Thursday, fri, next wednesday, last week tue, mon 3 weeks ago, aug 15

Alternatively an exact dates like 5/24/2022 can also be used.

You can play around with what works here: https://sugarjs.com/dates/#/Parsing`;

  if ( !Date.isValid( date ) ) {
    if ( !dontThrow )
      throw new Error( message );

    return message;
  } else {return true;}
}

export async function validateProject( projectCode: string|undefined ) {
  const projects = await readProjects();

  if ( !( projectCode  && projects[projectCode] ) )
    throw new Error( `The project does not exist.

To check existing: project list
To add a new one : project add` );

}
export async function validateTaskDetails( projectCode: string|undefined, taskDetails: string|undefined ) {
  const projects = await readProjects();

  if ( !( projectCode && taskDetails && projects[projectCode] && projects[projectCode].taskDetails[taskDetails] ) )
    throw new Error( `Invalid combination of project and task details (either both or one of them don't exist.)

To check existing: project list
To add a new one : project add` );
}
