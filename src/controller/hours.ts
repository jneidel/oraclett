import { CliUx } from "@oclif/core";
const { Date } = require( "sugar" );
import { fs, HOURS_FILE } from "../config";
import { combineToOracleString } from "./utils";
import { readProjects } from "./project";

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
  let hours = await readHours( true );

  const date = Date.create( dateString );

  const [ isoWeek, isoYear, dayOfTheWeek ] = Date.format( date, "%V %G %a" ).split( " " );
  const structure = {
    [isoYear]: {
      [isoWeek]: {
        [project]: {
          [taskDetails]: {
            [dayOfTheWeek]: hoursToLog,
          },
        },

      },
    },
  };

  if ( !hours[isoYear] ) {
    hours = Object.assign( hours, structure );
  } else if ( !hours[isoYear][isoWeek] ) {
    hours[isoYear] = Object.assign( hours[isoYear], structure[isoYear] );
  } else if ( !hours[isoYear][isoWeek][project] ) {
    hours[isoYear][isoWeek] = Object.assign( hours[isoYear][isoWeek], structure[isoYear][isoWeek] );
  } else if ( !hours[isoYear][isoWeek][project][taskDetails] ) {
    hours[isoYear][isoWeek][project] = Object.assign( hours[isoYear][isoWeek][project], structure[isoYear][isoWeek][project] );
  } else if ( !hours[isoYear][isoWeek][project][taskDetails][dayOfTheWeek] ) {
    hours[isoYear][isoWeek][project][taskDetails] = Object.assign( hours[isoYear][isoWeek][project][taskDetails], structure[isoYear][isoWeek][project][taskDetails] );
  } else if ( hours[isoYear][isoWeek][project][taskDetails][dayOfTheWeek] ) {
    const currentHours =  hours[isoYear][isoWeek][project][taskDetails][dayOfTheWeek];
    const combinedHours = Number( currentHours ) + Number( hoursToLog );
    if ( combinedHours > 8 && !force )
      throw new Error( `${combinedHours} --force` );
    else
      hours[isoYear][isoWeek][project][taskDetails][dayOfTheWeek] = Number( combinedHours );
  } else {
    console.log( "bruh" );
  }
  await writeHours( hours );

  // print out weekly hours logged for that combination
}

export async function listHours( dateStringOrWeekNr: string|number, shortendTitles ) {
  let date;
  if ( typeof dateStringOrWeekNr === "number" ) {
    // date = new Date();
    // date.setISOWeek(); broken
  } else {
    date = Date.create( dateStringOrWeekNr );
  }
  const [ isoWeek, isoYear ] = Date.format( date, "%V %G" ).split( " " );

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
    function calulcateTotal( combiHours ) {
      const total = Object.keys( combiHours ).reduce( ( acc, key ) => {
        const hours = combiHours[key];
        if ( typeof hours === "number" ) {
          totals[key] += hours;
          return acc + hours;
        } else {return acc;}
      }, 0 );
      totals.total += total;
      return total;
    }

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

    const rawProjectsData = await readProjects();
    const projectTaskDetailText = projectTaskDetailCombinations.map( ( combi: any ) => {  // TODO: include descriptions
      if ( shortendTitles ) {return `${combi.project}: ${combi.taskDetail} `;} else {
        const rawProject = rawProjectsData[combi.project];
        const projectText = combineToOracleString( combi.project, rawProject.description );
        const taskDetailText = combineToOracleString( combi.taskDetail, rawProject.taskDetails[combi.taskDetail].description );

        return `${projectText}: ${taskDetailText} `;
      }
    } );

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

  console.log( project, taskDetail, year, week, dayOfTheWeek, newHours );

  hours[year][week][project][taskDetail][dayOfTheWeek] = newHours;
}
