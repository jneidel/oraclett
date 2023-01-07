import { CliUx } from "@oclif/core";
import { fs, HOURS_FILE } from "../config";
import { getFullNames, createAndMergeWithStructure, parseDateStringForValues } from "./utils";

export const readHours = async ( forceReadingFromDisk = false ) => fs.read( HOURS_FILE, forceReadingFromDisk );
const writeHours = async data => fs.write( HOURS_FILE, data );

export async function addHours( data: {
  hoursToLog: number|any;
  dateString: string|any;
  project: string|any;
  taskDetail: string|any;
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
