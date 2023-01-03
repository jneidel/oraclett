import chalk from "chalk";
const { Date } = require( "sugar" );
import { fs, HOURS_FILE } from "../config";
import { parseOracleString, combineToOracleString } from "./utils";

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
