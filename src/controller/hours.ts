import { CliUx } from "@oclif/core";
import chalk from "chalk";
import { fs, HOURS_FILE } from "../config";
import { getFullNames, createAndMergeWithStructure, parseDateStringForValues } from "./utils";

export const readHours = async ( forceReadingFromDisk = false ) => fs.read( HOURS_FILE, forceReadingFromDisk );
export const writeHours = async data => fs.write( HOURS_FILE, data );

export async function addHours( data: {
  hoursToLog: number|any;
  dateString: string;
  project: string;
  taskDetail: string;
  force: boolean;
} ) {
  const { hoursToLog, dateString, project, taskDetail, force } = data;
  const ogHours = await readHours( true );

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

  console.log( "Successfully added hours" );
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
        acc[dotw] = chalk.magenta( projectWeeklyHours[dotw] );
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
        return `${combi.project}: ${combi.taskDetail} `;
      } else {
        const [ projectName, taskDetailName  ] = await Promise.all( [
          getFullNames.project( combi.project, { keyColor: "project" } ),
          getFullNames.taskDetail( combi.project, combi.taskDetail, { keyColor: "td" } ),
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

    console.log( `Hours logged for week ${isoWeek} of ${isoYear}:` );
    CliUx.ux.table( tableData, columns, {} );
  }
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
