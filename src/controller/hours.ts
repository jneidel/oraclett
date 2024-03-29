import { CliUx } from "@oclif/core";
import inquirer from "inquirer";
import Hour from "../data/hour";
import { getFullNames, createAndMergeWithStructure, parseDateStringForValues, createHumanReadableWeekIdentifier, applyColor } from "./utils";

export async function addHours( data: {
  hoursToLog: number|any;
  dateString: string;
  project: string;
  taskDetail: string;
  force: boolean;
} ) {
  const { hoursToLog, dateString, project, taskDetail, force } = data;
  const ogHours = await Hour.readAll( true );

  const [ isoWeek, isoYear, dayOfTheWeek ] = parseDateStringForValues( dateString, "%V %G %a" );
  const structure = {
    [isoYear]: {
      [isoWeek]: {
        [project]: {
          [taskDetail]: {
            [dayOfTheWeek]: 0,
          },
        },

      },
    },
  };
  const newHours = createAndMergeWithStructure( ogHours, structure, ( a: number ) => a + hoursToLog );

  const combinedHours = newHours[isoYear][isoWeek][project][taskDetail][dayOfTheWeek];
  if ( combinedHours > 8 && !force )
    throw new Error( `${combinedHours} --force` );

  console.log( "Successfully added hours\n" );
  await Hour.writeAll( newHours );

  listHours( dateString, false );
}

export async function listHours( dateString: string, useShortedTitles: boolean ) {
  const [ isoWeek, isoYear ] = parseDateStringForValues( dateString, "%V %G" );
  const relevantHours = await Hour.readByYearAndWeek( isoYear, isoWeek );
  const projects = Object.keys( relevantHours );

  var projectTaskDetailCombinations = projects.reduce( ( acc, project ) => {
    const taskDetails = Object.keys( relevantHours[project] );
    taskDetails.filter( tdKey => {
      if ( Object.keys( relevantHours[project][tdKey] ).length === 0 )
        return false; // no data inside the object
      else
        return true;

    } ).forEach( tdKey => {
      // @ts-ignore
      acc.push( {
        project,
        taskDetail: tdKey,
      } );
    } );
    return acc;
  }, [] );

  const totals = { total: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const calulcateTotal = ( projectWeeklyHours ) => {
    const total = Object.keys( projectWeeklyHours ).reduce( ( acc, key ) => {
      const hours = projectWeeklyHours[key];
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
    let projectWeeklyHours = relevantHours[project][taskDetail];
    const total = calulcateTotal( projectWeeklyHours );

    projectWeeklyHours = Object.keys( projectWeeklyHours ).reduce( ( acc, dotw ) => {
      acc[dotw] = applyColor( "hour", projectWeeklyHours[dotw] );
      return acc;
    }, {} );

    if ( !hasWeekend )
      hasWeekend = !!( projectWeeklyHours.Sat || projectWeeklyHours.Sun );

    return {
      Mon: projectWeeklyHours.Mon,
      Tue: projectWeeklyHours.Tue,
      Wed: projectWeeklyHours.Wed,
      Thu: projectWeeklyHours.Thu,
      Fri: projectWeeklyHours.Fri,
      Sat: projectWeeklyHours.Sat,
      Sun: projectWeeklyHours.Sun,
      total,
    };
  } );

  const projectTaskDetailText = await Promise.all( projectTaskDetailCombinations.map( async ( combi: any ) => {
    if ( useShortedTitles ) {
      return `${applyColor( "project", combi.project )}: ${applyColor( "taskDetail", combi.taskDetail )} `;
    } else {
      const [ projectName, taskDetailName  ] = await Promise.all( [
        getFullNames.project( combi.project, { colorForWhat: "project" } ),
        getFullNames.taskDetail( combi.project, combi.taskDetail, { colorForWhat: "taskDetail" } ),
      ] );

      return `${projectName}: ${taskDetailName} `;
    }
  } ) );

  const tableData = projectTaskDetailText.map( ( project, index ) => {
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

  const humanReadableWeekIdentifier = createHumanReadableWeekIdentifier( dateString, { noLeadingProposition: true } );
  console.log( `Hours logged for ${applyColor( "hour", humanReadableWeekIdentifier )}:` );
  CliUx.ux.table( tableData, columns, {} );
}

export async function editHours( data: {
  newHours: number;
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
} ) {
  const { project, taskDetail, year, week, dayOfTheWeek, newHours } = data;

  const hours = await Hour.readAll( true );
  hours[year][week][project][taskDetail][dayOfTheWeek] = newHours;
  await Hour.writeAll( hours );
}
export async function removeHours( data: {
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
} ) {
  const { project, taskDetail, year, week, dayOfTheWeek } = data;

  const hours = await Hour.readAll( true );
  delete hours[year][week][project][taskDetail][dayOfTheWeek];
  await Hour.writeAll( hours );
}

export async function addHoursWithAskingForForceConfirmation( data: { hoursToLog: number; dateString: string; project: string; taskDetail: string; force: boolean } ) {
  const { hoursToLog, dateString, project, taskDetail, force } = data;

  try {
    await addHours( { hoursToLog, dateString, project, taskDetail, force } );
  } catch ( err: any ) {
    if ( err.message.match( /--force/ ) ) {
      const [ combinedHours ] = err.message.split( " " );
      const confirm = await inquirer.prompt( [ {
        type   : "confirm",
        name   : "force",
        message: `You are attempting to log a combined ${combinedHours} hours for a workday. Continue?`,
      } ] ).then( answers => answers.force );
      if ( confirm )
        await addHours( { hoursToLog, dateString, project, taskDetail, force: true } );
    } else {
      console.error( err.message );
    }
  }
}
