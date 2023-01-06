import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { readHours, removeHours, dayWeekMode } from "../../controller/hours";
import { getReadableChoices, parseDateStringForValues } from "../../controller/utils";

export default class Remove extends Command {
  static summary = "Remove logged hours interactively.";
  static description = dayWeekMode.helpText;
  static examples = dayWeekMode.examples;

  static flags = {
    date: dayWeekMode.dateFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Remove );
    const dateString = flags.date;

    const [ week, year, dayInQuestion ] = parseDateStringForValues( dateString, "%V %G %a" );
    let operatingMode = dayWeekMode.evalOperatingMode( dateString );
    let throwNoTimeLoggedError = dayWeekMode.getNoTimeLoggedErrorFunction( dateString, this.error );

    const hours = await readHours();
    if ( !( hours[year] && hours[year][week] ) )
      throwNoTimeLoggedError();
    const hoursData = hours[year][week];

    if ( dateString === "today" && !dayWeekMode.dayModeHasResults( hoursData, dayOfTheWeek ) ) {
      this.log( "No entries for today. Changing to week mode." );
      operatingMode = "week";
      throwNoTimeLoggedError = dayWeekMode.getNoTimeLoggedErrorFunction( "this week", this.error );
    }

    if ( operatingMode === "day" ) {
      var { project, taskDetail, dayOfTheWeek } = await dayMode( dayInQuestion, hoursData, throwNoTimeLoggedError );
    } else {
      // @ts-ignore
      var { project, taskDetail, dayOfTheWeek } = await weekMode( hoursData, throwNoTimeLoggedError );
    }

    const currentHours = hoursData[project][taskDetail][dayOfTheWeek];
    const { confirmDeletion } = await inquirer.prompt( [ {
      type   : "confirm",
      name   : "confirmDeletion",
      message: `Execute deletion of ${currentHours} hours?`,
      default: true,
    } ] );

    if ( confirmDeletion )
      removeHours( { project, taskDetail, year, week, dayOfTheWeek } );
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

