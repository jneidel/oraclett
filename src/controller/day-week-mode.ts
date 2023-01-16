import { Flags } from "@oclif/core";
import * as askFor from "./questions";
import { parseDateStringForValues } from "./utils";

export const helpText = `If a day is specified, you will edit that days hours.
If a week is specified, you will be able to pick a day to edit for.

Examples of specifying a day : today, yesterday, fri, 5/25
Examples of specifying a week: this week, last week, 2 weeks ago`;
export const examples = [ `$ <%= config.bin %> <%= command.id %> # today
$ <%= config.bin %> <%= command.id %> -d "last fri"`,
`$ <%= config.bin %> <%= command.id %> -d "this week"
$ <%= config.bin %> <%= command.id %> -d "last week"
` ];
export const dateFlag = Flags.string( {
  char       : "d",
  description: "A date to specify the day OR the week (can be human-readable)",
  default    : "today",
} );

type OperatingMode = "week"|"day";
export function evalOperatingMode( dateString: string ): OperatingMode {
  const [ h, m, s ] = parseDateStringForValues( dateString, "%H %M %S" );

  let operatingMode: OperatingMode = "week";
  if ( h === "00" && m === "00" && s === "00" )
    operatingMode = "day";

  return operatingMode;
}

export function getNoEntriesErrorFunction( dateString: string, errorFunc: Function, object: "hours"|"note", forceMode?: OperatingMode ): Function {
  const [ week, year ] = parseDateStringForValues( dateString, "%V %G" );
  const operatingMode = forceMode ? forceMode : evalOperatingMode( dateString );

  const isHours = object === "hours";

  const hoursEntity = "hours logged";
  const noteEnity = "notes added";

  const hoursCommandRecommendation = "To log some use: hours add";
  const noteCommandRecommendation = "To add one use: note add";

  const weekMessage = `No ${isHours ? hoursEntity : noteEnity} ${isHours ? "in" : "for"} week ${week} of ${year}.
Specify another timeframe using: -d, --date

${isHours ? hoursCommandRecommendation : noteCommandRecommendation}`;
  const dayMessage = `No ${isHours ? hoursEntity : noteEnity} for ${dateString}.
Specify another timeframe using: -d, --date

${isHours ? hoursCommandRecommendation : noteCommandRecommendation}`;

  const message = operatingMode === "day" ? dayMessage : weekMessage;
  return () => errorFunc( message );
}

export async function runWeekMode( data, throwNoTimeLoggedError: Function ) {
  const project = await selectProject( data, throwNoTimeLoggedError );
  const taskDetail = await selectTaskDetail( project, data[project], throwNoTimeLoggedError );
  const dayOfTheWeek: string = await selectDayOfTheWeek( data[project][taskDetail], throwNoTimeLoggedError );

  return { project, taskDetail, dayOfTheWeek };
}

export async function runDayMode( dayOfTheWeek: string, data, throwNoTimeLoggedError: Function ) {
  const combinationsWithTheCorrectDOTW = assembleProjectCombinationsForDOTW( data, dayOfTheWeek );

  const projectsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW.map( x => x.project ) ) ];
  const projectSelection = removeAllKeysExcept( data, projectsInQuestion );
  const project = await selectProject( projectSelection, throwNoTimeLoggedError );

  const taskDetailsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW
    .filter( x => x.project === project )
    .map( x => x.td ) ) ];
  const taskDetailSelection = removeAllKeysExcept( data[project], taskDetailsInQuestion );
  const taskDetail = await selectTaskDetail( project, taskDetailSelection, throwNoTimeLoggedError );

  return { project, taskDetail, dayOfTheWeek };
}
function removeAllKeysExcept( obj, exceptions: string[] ) {
  const clone = Object.assign( {}, obj );

  Object.keys( clone )
    .filter( x => !exceptions.includes( x ) )
    .forEach( key => delete clone[key] );

  return clone;
}
export function assembleProjectCombinationsForDOTW( data, dayOfTheWeek: string ): any {
  return Object.keys( data ).reduce( ( acc, project ) => {
    const tdsWithCorrectDOTW = Object.keys( data[project] ).filter( td => {
      const hasCorrectDOTW = !!data[project][td][dayOfTheWeek];
      return hasCorrectDOTW;
    } );

    // @ts-ignore
    tdsWithCorrectDOTW.forEach( td => acc.push( { project, td } ) );

    return acc;
  }, [] );
}
export function dayModeHasResults( data, dayOfTheWeek ) {
  const combinationsWithTheCorrectDOTW = assembleProjectCombinationsForDOTW( data, dayOfTheWeek );
  const projectsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW.map( x => x.project ) ) ];

  return projectsInQuestion.length !== 0;
}

async function selectProject( data, throwNoTimeLoggedError: Function ): Promise<string> {
  const projectsToChooseFrom = Object.keys( data );
  return askFor.project( projectsToChooseFrom )
    .catch( () =>  throwNoTimeLoggedError() );
}

async function selectTaskDetail( project: string, data, throwNoTimeLoggedError: Function ): Promise<string> {
  const taskDetailsToChooseFrom = Object.keys( data );
  return askFor.taskDetail( project, taskDetailsToChooseFrom )
    .catch( () =>  throwNoTimeLoggedError() );
}

async function selectDayOfTheWeek( data, throwNoTimeLoggedError: Function ): Promise<string> {
  if ( Object.keys( data ).length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( Object.keys( data ).length === 1 ) {
    const dayOfTheWeek = Object.keys( data )[0];
    console.log( `Using ${dayOfTheWeek}` );
    return new Promise( ( resolve ) => resolve( dayOfTheWeek ) );
  } else {
    return askFor.dayOfTheWeek( Object.keys( data ) );
  }
}
