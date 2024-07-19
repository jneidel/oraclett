import { CliUx } from "@oclif/core";
import Note from "../data/note";
import Hour from "../data/hour";
import { applyColor, getFullNames, parseDateStringForValues } from "./utils";

export async function generateReports( dateString: string, noInteractive: boolean, classicMode: boolean, errorFunc: Function ) {
  const [ week, year ] = parseDateStringForValues( dateString, "%V %G" );

  const [ notes, hours ] = await Promise.all( [
    Note.readAll().then( data => data[year][week] ).catch( () => ( {} ) ).then( data => data !== undefined ? data : {} ),
    Hour.readAll().then( data => data[year][week] ).catch( () => ( {} ) ).then( data => data !== undefined ? data : {} ),
  ] );

  const projects = [ ...new Set( [ ...Object.keys( notes ), ...Object.keys( hours ) ] ) ];
  if ( projects.length === 0 )
    errorFunc( `No hours or notes have been logged for the selected week.
Meant anoter week? Specify it using: -d, --date

To log some hours: hour add
To keep some notes: note add` );

  const noteStringsForClipboard: any[] = [];
  const reports = await Promise.all( projects.map( async projectKey => {
    const projectString = await getFullNames.project( projectKey, { colorForWhat: "project", style: "hyphen" } );

    let taskDetails: string[] = [];
    if ( notes[projectKey] )
      taskDetails = [ ...Object.keys( notes[projectKey] ) ];
    if ( hours[projectKey] )
      taskDetails = [ ...taskDetails, ...Object.keys( hours[projectKey] ) ];
    taskDetails = [ ...new Set( taskDetails ) ];

    return Promise.all( taskDetails.map( async taskDetailKey => {
      const taskDetailString = await getFullNames.taskDetail( projectKey, taskDetailKey, { colorForWhat: "taskDetail", style: "hyphen" } );

      let relevantHours = hours?.[projectKey]?.[taskDetailKey];
      relevantHours = relevantHours && Object.keys( relevantHours ).length !== 0 ? relevantHours : undefined;
      let relevantNotes = notes?.[projectKey]?.[taskDetailKey];
      relevantNotes = relevantNotes && Object.keys( relevantNotes ).length !== 0 ? relevantNotes : undefined;

      if ( !( relevantNotes || relevantHours ) )
        return null;

      const sortDaysOfTheWeek =  ( a, b ) => {
        const daysOfTheWeekInOrder = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ];
        if ( daysOfTheWeekInOrder.indexOf( a ) > daysOfTheWeekInOrder.indexOf( b ) )
          return 1;
        else
          return -1;
      };

      let hoursString = "";
      if ( relevantHours ) {
        const groupByHourAmount = Object.keys( relevantHours ).reduce( ( acc, dotw ) => {
          const amountOfHours = relevantHours[dotw];
          if ( acc[amountOfHours] )
            acc[amountOfHours].push( dotw );
          else
            acc[amountOfHours] = [ dotw ];

          return acc;
        }, {} );
        hoursString = Object.keys( groupByHourAmount ).map( amountOfHours => {
          const daysOfTheWeek = groupByHourAmount[amountOfHours].sort( sortDaysOfTheWeek );

          return `  Dates:    ${applyColor( "hour", daysOfTheWeek.join( " " ) )}
    Quantity: ${applyColor( "hour", amountOfHours )}`;
        } ).join( "\n  -------------\n" );
      }

      let noteStringArr: string[] = [];
      let noteStringArrNoDOTW: string[] = [];
      let prettyNoteStringArr: string[] = [];
      let noteString = "";
      if ( relevantNotes ) {
        noteStringArr = Object.keys( relevantNotes ).sort( sortDaysOfTheWeek ).reduce( ( acc: string[], dotw ) => {
          acc.push( `${dotw}: ${relevantNotes[dotw]}` );
          return acc;
        }, [] );
        noteStringArrNoDOTW = Object.keys( relevantNotes ).sort( sortDaysOfTheWeek ).reduce( ( acc: string[], dotw ) => {
          acc.push( relevantNotes[dotw] );
          return acc;
        }, [] );
        prettyNoteStringArr = noteStringArr
          .map( string => `Comments for ${applyColor( "note", string.split( ":" )[0].trim() )}${noInteractive ? "" : " (copied to clipboard)"}:\n  ${applyColor( "note", string.split( ":" )[1].trim() )}` );

        if ( noteStringArr.length !== 0 )
          noteString = `\nComments${noInteractive ? "" : " (copied to clipboard)"}:\n  ${applyColor( "note", noteStringArr.join( "; " ) )}`;
      }

      if ( !classicMode ) {
        noteStringsForClipboard.push( noteStringArr.join( "; " ) || "" );
        return [ () => {
          console.log( `Project Code: ${projectString}
Task Details: ${taskDetailString}
Date Groups:
${hoursString}${noteString}
` );
        } ];
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
            let tableData = { project: `${projectString}: ${taskDetailString}` };
            if ( relevantHours )
              tableData = Object.entries( relevantHours ).reduce( ( acc, [ dotw, hourAmount ]: any ) => {
                acc[dotw] = applyColor( "hour", hourAmount );
                return acc;
              }, tableData );

            CliUx.ux.table( [ tableData ], columns, {} );

            if ( !noInteractive )
              console.log( `\nCopied project key to clipboard (${applyColor( "ticket", projectKey )})` );
          },
          prettyNoteStringArr.map( string => () => {console.log( string );} ),
        ].flat();
      }
    } ) );
  } ) ).then( data => data.flat().filter( x => x !== null && Array.isArray( x ) ) );

  return [ reports.flat(), noteStringsForClipboard.flat() ];
}
