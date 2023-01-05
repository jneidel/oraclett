import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
const { Date } = require( "sugar" );
import { readProjects } from "../../controller/project";
import { readHours, editHours } from "../../controller/hours";
import { getReadableChoices } from "../../controller/utils";
import { validateDateString } from "../../controller/validation";

export default class Edit extends Command {
  static summary = "Edit the logged hours.";
  static description = `If a day is specified, you will edit that days hours.
If a week is specified, you will be able to pick a day to edit for.

Examples of specifying a day : today, yesterday, fri, 5/25
Examples of specifying a week: this week, last week, 2 weeks ago`;

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the day OR the week (can be human-readable)",
      default    : "today",
    } ),
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %> # today
$ <%= config.bin %> <%= command.id %> -d "last fri"`,
  `$ <%= config.bin %> <%= command.id %> -d "this week"
$ <%= config.bin %> <%= command.id %> -d "last week"
` ];

  async run(): Promise<void> {
    const { flags } = await this.parse( Edit );
    const [ projects, hours ] = await Promise.all( [ readProjects(), readHours() ] );

    const dateString = flags.date;
    validateDateString( dateString );
    const date = Date.create( dateString );
    const [ week, year, dayInQuestion, h, m, s ] = Date.format( date, "%V %G %a %H %M %S" ).split( " " );

    let operatingMode = "week";
    if ( h === "00" && m === "00" && s === "00" )
      operatingMode = "day";

    const throwNoTimeLoggedWeekError = () => {
      const message = `No hours logged in week ${week} of ${year}.
Specify another timeframe using: -d, --date

To log some use: hours add.`;
      this.error( message );
    };
    const throwNoTimeLoggedDayError = () => {
      const message = `No hours logged on ${dateString}.
Specify another timeframe using: -d, --date

To log some use: hours add.`;
      this.error( message );
    };
    const throwNoTimeLoggedError = operatingMode === "day"
      ? throwNoTimeLoggedDayError : throwNoTimeLoggedWeekError;

    if ( !( hours[year] && hours[year][week] ) )
      throwNoTimeLoggedError();

    const hoursData = hours[year][week];
    if ( operatingMode === "day" ) {var { project, taskDetail, dayOfTheWeek } = await dayMode( dayInQuestion, hoursData, throwNoTimeLoggedError );} else {
      // @ts-ignore
      var { project, taskDetail, dayOfTheWeek } = await weekMode( hoursData, throwNoTimeLoggedError );
    }

    const currentHours = hoursData[project][taskDetail][dayOfTheWeek];
    const { newHours } = await inquirer.prompt( [ {
      type   : "number",
      name   : "newHours",
      message: `To how many hours should this be changed? (Current: ${currentHours})`,
      default: currentHours,
      validate( value ) {
        const valid = !isNaN( parseFloat( value ) );
        return valid || "Please enter a number";
      },
    } ] );

    editHours( { newHours, project, taskDetail, year, week, dayOfTheWeek } );
  }
}

async function weekMode( hoursData, throwNoTimeLoggedError: Function ) {
  const project = await askForProject( hoursData, throwNoTimeLoggedError );
  const taskDetail = await askForTaskDetail( project, hoursData[project], throwNoTimeLoggedError );
  const dayOfTheWeek: string = await askForDayOfTheWeek( hoursData[project][taskDetail], throwNoTimeLoggedError );

  return { project, taskDetail, dayOfTheWeek };
}

async function dayMode( dayOfTheWeek: string, hoursData, throwNoTimeLoggedError: Function ) {
  const combinationsWithTheCorrectDOTW: any = Object.keys( hoursData ).reduce( ( acc, project ) => {
    const tdsWithCorrectDOTW = Object.keys( hoursData[project] ).filter( td => {
      const hasCorrectDOTW = !!hoursData[project][td][dayOfTheWeek];
      return hasCorrectDOTW;
    } );

    // @ts-ignore
    tdsWithCorrectDOTW.forEach( td => acc.push( { project, td } ) );

    return acc;
  }, [] );

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
