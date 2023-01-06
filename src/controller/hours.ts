import { CliUx } from "@oclif/core";
import { Flags } from "@oclif/core";
import inquirer from "inquirer";
import { fs, HOURS_FILE } from "../config";
import { getFullNames, getReadableChoices, createAndMergeWithStructure, parseDateStringForValues } from "./utils";

export const readHours = async ( forceReadingFromDisk = false ) => fs.read( HOURS_FILE, forceReadingFromDisk );
const writeHours = async data => fs.write( HOURS_FILE, data );

export async function addHours( data: {
  hoursToLog: number|any;
  dateString: string|any;
  project: string|any;
  taskDetails: string|any;
  force: boolean;
} ) {
  const { hoursToLog, dateString, project, taskDetails, force } = data;
  const ogHours = await readHours( true );

  const [ isoWeek, isoYear, dayOfTheWeek ] = parseDateStringForValues( dateString, "%V %G %a" );
  const structure = {
    [isoYear]: {
      [isoWeek]: {
        [project]: {
          [taskDetails]: {
            [dayOfTheWeek]: 0,
          },
        },

      },
    },
  };
  const newHours = createAndMergeWithStructure( ogHours, structure, ( a: number ) => a + hoursToLog );

  const combinedHours = newHours[isoYear][isoWeek][project][taskDetails][dayOfTheWeek];
  if ( combinedHours > 8 && !force )
    throw new Error( `${combinedHours} --force` );

  await writeHours( newHours );
}

export async function listHours( dateString: string, useShortedTitles: boolean ) {
  const [ isoWeek, isoYear ] = parseDateStringForValues( dateString, "%V %G" );

  const relevantHours = await readHours()
    .then( hours => hours[isoYear][isoWeek] )
    .catch( () => null );

  if ( !relevantHours ) {
    console.log( `No hours logged in week ${isoWeek} of ${isoYear}.

To log some use: hours add` );
  } else {
    const projects = Object.keys( relevantHours );
    const projectTaskDetailCombinations = projects.reduce( ( acc, project ) => {
      const taskDetails = Object.keys( relevantHours[project] );
      taskDetails.forEach( tdKey => {
        // @ts-ignore
        acc.push( {
          project,
          taskDetail: tdKey,
        } );
      } );
      return acc;
    }, [] );

    const totals = { total: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const calulcateTotal = ( combiHours ) => {
      const total = Object.keys( combiHours ).reduce( ( acc, key ) => {
        const hours = combiHours[key];
        if ( typeof hours === "number" ) {
          totals[key] += hours;
          return acc + hours;
        } else {return acc;}
      }, 0 );
      totals.total += total;
      return total;
    };

    let hasWeekend = false;
    const hoursPerWeekday = projectTaskDetailCombinations.map( combi => {
      const { project, taskDetail } = combi;
      const combiHours = relevantHours[project][taskDetail];

      if ( !hasWeekend )
        hasWeekend = !!( combiHours.Sat || combiHours.Sun );

      const total = calulcateTotal( combiHours );

      return {
        Mon: combiHours.Mon,
        Tue: combiHours.Tue,
        Wed: combiHours.Wed,
        Thu: combiHours.Thu,
        Fri: combiHours.Fri,
        Sat: combiHours.Sat,
        Sun: combiHours.Sun,
        total,
      };
    } );

    const projectTaskDetailText = await Promise.all( projectTaskDetailCombinations.map( async ( combi: any ) => {
      if ( useShortedTitles ) {
        return `${combi.project}: ${combi.taskDetail} `;
      } else {
        const [ projectName, taskDetailName  ] = await Promise.all( [
          getFullNames.project( combi.project ),
          getFullNames.taskDetail( combi.project, combi.taskDetail ),
        ] );

        return `${projectName}: ${taskDetailName} `;
      }
    } ) );

    const tableData  = projectTaskDetailText.map( ( project, index ) => {
      const hours = hoursPerWeekday[index];
      return Object.assign( { project }, hours );
    } );

    Object.keys( totals ).forEach( key => {
      if ( totals[key] === 0 )
        totals[key] = undefined;
    } );
    tableData.push( Object.assign( { project: "Sums" }, totals ) );

    const columns: any = Object.assign(
      {
        project: {
          header: "Project: Task Details",
        },
        Mon: {},
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {},
      },
      hasWeekend ? { Sat: {}, Sun: {} } : {},
      { total: {} }
    );

    console.log( `Logged hours for week ${isoWeek} of ${isoYear}:\n` );
    CliUx.ux.table( tableData, columns, {} );
  }
}

export async function editHours( data: {
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
  newHours: number;
} ) {
  const { project, taskDetail, year, week, dayOfTheWeek, newHours } = data;
  const hours = await readHours( true );

  hours[year][week][project][taskDetail][dayOfTheWeek] = newHours;

  await writeHours( hours );
}
export async function removeHours( data: {
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
} ) {
  const { project, taskDetail, year, week, dayOfTheWeek } = data;
  const hours = await readHours( true );

  delete hours[year][week][project][taskDetail][dayOfTheWeek];

  await writeHours( hours );
}

const dayWeekModeHelpText = `If a day is specified, you will edit that days hours.
If a week is specified, you will be able to pick a day to edit for.

Examples of specifying a day : today, yesterday, fri, 5/25
Examples of specifying a week: this week, last week, 2 weeks ago`;
const dayWeekModeExamples = [ `$ <%= config.bin %> <%= command.id %> # today
$ <%= config.bin %> <%= command.id %> -d "last fri"`,
`$ <%= config.bin %> <%= command.id %> -d "this week"
$ <%= config.bin %> <%= command.id %> -d "last week"
` ];
const dayWeekModeDateFlag = Flags.string( {
  char       : "d",
  description: "A date to specify the day OR the week (can be human-readable)",
  default    : "today",
} );

type OperatingMode = "week"|"day";
function evalOperatingMode( dateString: string ): OperatingMode {
  const [ h, m, s ] = parseDateStringForValues( dateString, "%H %M %S" );

  let operatingMode: OperatingMode = "week";
  if ( h === "00" && m === "00" && s === "00" )
    operatingMode = "day";

  return operatingMode;
}

function throwDayWeekModeError( dateString: string, errorFunc: Function ): Function {
  const [ week, year ] = parseDateStringForValues( dateString, "%V %G" );
  const operatingMode = evalOperatingMode( dateString );

  const throwNoTimeLoggedWeekError = () => {
    const message = `No hours logged in week ${week} of ${year}.
Specify another timeframe using: -d, --date

To log some use: hours add.`;
    errorFunc( message );
  };
  const throwNoTimeLoggedDayError = () => {
    const message = `No hours logged on ${dateString}.
Specify another timeframe using: -d, --date

To log some use: hours add.`;
    errorFunc( message );
  };

  return operatingMode === "day" ? throwNoTimeLoggedDayError : throwNoTimeLoggedWeekError;
}

async function weekMode( hoursData, throwNoTimeLoggedError: Function ) {
  const project = await askForProject( hoursData, throwNoTimeLoggedError );
  const taskDetail = await askForTaskDetail( project, hoursData[project], throwNoTimeLoggedError );
  const dayOfTheWeek: string = await askForDayOfTheWeek( hoursData[project][taskDetail], throwNoTimeLoggedError );

  return { project, taskDetail, dayOfTheWeek };
}

async function dayMode( dayOfTheWeek: string, hoursData, throwNoTimeLoggedError: Function ) {
  const combinationsWithTheCorrectDOTW = assembleProjectCombinationsForDOTW( hoursData, dayOfTheWeek );

  let project = "";
  const projectsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW.map( x => x.project ) ) ];
  if ( projectsInQuestion.length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( projectsInQuestion.length === 1 ) {
    console.log( `Using ${projectsInQuestion[0]}` );
    project = projectsInQuestion[0];
  } else {
    const scrubbedHoursData = removeAllKeysExcept( hoursData, projectsInQuestion );
    project = await askForProject( scrubbedHoursData, throwNoTimeLoggedError );
  }

  let taskDetail = "";
  const taskDetailsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW
    .filter( x => x.project === project )
    .map( x => x.td ) ) ];
  if ( taskDetailsInQuestion.length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( taskDetailsInQuestion.length === 1 ) {
    console.log( `Using ${taskDetailsInQuestion[0]}` );
    taskDetail = taskDetailsInQuestion[0];
  } else {
    const scrubbedHoursData = removeAllKeysExcept( hoursData[project], taskDetailsInQuestion );
    taskDetail = await askForTaskDetail( project, scrubbedHoursData, throwNoTimeLoggedError );
  }

  return { project, taskDetail, dayOfTheWeek };
}
function removeAllKeysExcept( obj, exceptions: string[] ) {
  const clone = Object.assign( {}, obj );

  Object.keys( clone )
    .filter( x => !exceptions.includes( x ) )
    .forEach( key => delete clone[key] );

  return clone;
}
function assembleProjectCombinationsForDOTW( hoursData, dayOfTheWeek: string ): any {
  return Object.keys( hoursData ).reduce( ( acc, project ) => {
    const tdsWithCorrectDOTW = Object.keys( hoursData[project] ).filter( td => {
      const hasCorrectDOTW = !!hoursData[project][td][dayOfTheWeek];
      return hasCorrectDOTW;
    } );

    // @ts-ignore
    tdsWithCorrectDOTW.forEach( td => acc.push( { project, td } ) );

    return acc;
  }, [] );
}
function dayModeHasResults( hoursData, dayOfTheWeek ) {
  const combinationsWithTheCorrectDOTW = assembleProjectCombinationsForDOTW( hoursData, dayOfTheWeek );
  const projectsInQuestion: any[] = [ ...new Set( combinationsWithTheCorrectDOTW.map( x => x.project ) ) ];

  return projectsInQuestion.length !== 0;
}

async function askForProject( hoursData, throwNoTimeLoggedError: Function ): Promise<string> {
  if ( Object.keys( hoursData ).length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( Object.keys( hoursData ).length === 1 ) {
    const project = Object.keys( hoursData )[0];
    console.log( `Using ${project}` );
    return new Promise( ( resolve ) => resolve( project ) );
  } else {
    return inquirer.prompt( [ {
      type   : "list",
      name   : "project",
      message: "What project?",
      choices: () => {
        const projectsToChooseFrom = Object.keys( hoursData );
        return getReadableChoices.project( projectsToChooseFrom );
      },
    } ] ).then( res => res.project );
  }
}

async function askForTaskDetail( project, hoursData, throwNoTimeLoggedError: Function ): Promise<string> {
  if ( Object.keys( hoursData ).length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( Object.keys( hoursData ).length === 1 ) {
    const taskDetail = Object.keys( hoursData )[0];
    console.log( `Using ${taskDetail}` );
    return new Promise( ( resolve ) => resolve( taskDetail ) );
  } else {
    return inquirer.prompt( [ {
      type   : "list",
      name   : "taskDetail",
      message: "What task detail?",
      choices: () => {
        const taskDetailsToChooseFrom = Object.keys( hoursData );
        return getReadableChoices.taskDetails( project, taskDetailsToChooseFrom );
      },
    } ] ).then( res => res.taskDetail );
  }
}

async function askForDayOfTheWeek( hoursData, throwNoTimeLoggedError: Function ): Promise<string> {
  if ( Object.keys( hoursData ).length === 0 ) {
    return throwNoTimeLoggedError();
  } else if ( Object.keys( hoursData ).length === 1 ) {
    const dayOfTheWeek = Object.keys( hoursData )[0];
    console.log( `Using ${dayOfTheWeek}` );
    return new Promise( ( resolve ) => resolve( dayOfTheWeek ) );
  } else {
    return inquirer.prompt( [ {
      type   : "list",
      name   : "dayOfTheWeek",
      message: "What day of the week?",
      choices: Object.keys( hoursData ),
    } ] ).then( res => res.dayOfTheWeek );
  }
}

export const dayWeekMode = {
  helpText                    : dayWeekModeHelpText,
  examples                    : dayWeekModeExamples,
  dateFlag                    : dayWeekModeDateFlag,
  evalOperatingMode,
  getNoTimeLoggedErrorFunction: throwDayWeekModeError,
  runDayMode                  : dayMode,
  runWeekMode                 : weekMode,
  dayModeHasResults,
};
