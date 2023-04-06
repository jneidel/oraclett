import chalk from "chalk";
import { CliUx } from "@oclif/core";
import { readNotes } from "./notes";
import { readHours } from "./hours";
import { getFullNames, parseDateStringForValues } from "./utils";

export async function generateReports( dateString: string, noInteractive: boolean, classicMode: boolean, errorFunc: Function ) {
  const [ week, year ] = parseDateStringForValues( dateString, "%V %G" );

  const notes = await readNotes().then( data => data[year][week] ).catch( () => ( {} ) ).then( data => data !== undefined ? data : {} );
  const hours = await readHours().then( data => data[year][week] ).catch( () => ( {} ) ).then( data => data !== undefined ? data : {} );

  const projects = [ ...new Set( [ ...Object.keys( notes ), ...Object.keys( hours ) ] ) ];
  if ( projects.length === 0 )
    errorFunc( `No hours or notes have been logged for the selected week.
Meant anoter week? Specify it using: -d, --date

To log some hours: hours add
To keep some notes: notes add` );

  const noteStringsForClipboard: any[] = [];
  const reports = await Promise.all( projects.map( async projectKey => {
    const projectString = await getFullNames.project( projectKey, { keyColor: "project", style: "hyphen" } );

    let taskDetails: string[] = [];
    if ( notes[projectKey] )
      taskDetails = [ ...Object.keys( notes[projectKey] ) ];
    if ( hours[projectKey] )
      taskDetails = [ ...taskDetails, ...Object.keys( hours[projectKey] ) ];
    taskDetails = [ ...new Set( taskDetails ) ];

    return Promise.all( taskDetails.map( async taskDetailKey => {
      const taskDetailString = await getFullNames.taskDetail( projectKey, taskDetailKey, { keyColor: "td", style: "hyphen" } );

      const relevantHours = hours?.[projectKey]?.[taskDetailKey];
      const relevantNotes = notes?.[projectKey]?.[taskDetailKey];
      if ( !( relevantNotes && relevantHours ) )
        return null;

      const sortDaysOfTheWeek =  ( a, b ) => {
        const daysOfTheWeekInOrder = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ];
        if ( daysOfTheWeekInOrder.indexOf( a ) > daysOfTheWeekInOrder.indexOf( b ) )
          return 1;
        else
          return -1;
      };

      const groupByHourAmount = Object.keys( relevantHours ).reduce( ( acc, dotw ) => {
        const amountOfHours = relevantHours[dotw];
        if ( acc[amountOfHours] )
          acc[amountOfHours].push( dotw );
        else
          acc[amountOfHours] = [ dotw ];

        return acc;
      }, {} );
      const hoursString = Object.keys( groupByHourAmount ).map( amountOfHours => {
        const daysOfTheWeek = groupByHourAmount[amountOfHours].sort( sortDaysOfTheWeek );

        return `  Dates:    ${chalk.magenta( daysOfTheWeek.join( " " ) )}
  Quantity: ${chalk.magenta( amountOfHours )}`;
      } ).join( "\n  -------------\n" );

      const noteStringArr = Object.keys( relevantNotes ).sort( sortDaysOfTheWeek ).reduce( ( acc: string[], dotw ) => {
        acc.push( `${dotw}: ${relevantNotes[dotw]}` );
        return acc;
      }, [] );
      const noteStringArrNoDOTW = Object.keys( relevantNotes ).sort( sortDaysOfTheWeek ).reduce( ( acc: string[], dotw ) => {
        acc.push( relevantNotes[dotw] );
        return acc;
      }, [] );
      const prettyNoteStringArr = noteStringArr
        .map( string => `Comments for ${chalk.yellow( string.split( ":" )[0].trim() )}${noInteractive ? "" : " (copied to clipboard)"}:\n  ${chalk.yellow( string.split( ":" )[1].trim() )}` );

      let noteString = "";
      if ( noteStringArr.length !== 0 )
        noteString = `\nComments${noInteractive ? "" : " (copied to clipboard)"}:\n  ${chalk.yellow( noteStringArr.join( "; " ) )}`;

      if ( !classicMode ) {
        noteStringsForClipboard.push( noteStringArr.join( "; " ) || "" );
        return () => {
          console.log( `Project Code: ${projectString}
Task Details: ${taskDetailString}
Date Groups:
${hoursString}${noteString}
` );
        };
      } else {
        noteStringsForClipboard.push( projectKey );
        noteStringsForClipboard.push( noteStringArrNoDOTW );
        return [
          ( noInteractive = false ) => {
            const columns: any = {
              project: {
                header: "Project: Task Details",
              },
              Mon: {},
              Tue: {},
              Wed: {},
              Thu: {},
              Fri: {},
              Sat: {},
              Sun: {},
            };
            const tableData = Object.assign( relevantHours, {
              project: `${projectString}: ${taskDetailString}`,
            } );

            CliUx.ux.table( [ tableData ], columns, {} );

            if ( !noInteractive )
              console.log( `\nCopied project key to clipboard (${chalk.green( projectKey )})` );
          },
          prettyNoteStringArr.map( string => () => {console.log( string );} ),
        ].flat();
      }
    } ) );
  } ) ).then( data => data.flat().filter( x => Array.isArray( x ) ) );

  return [ reports.flat(), noteStringsForClipboard.flat() ];
}
