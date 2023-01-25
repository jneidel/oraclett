import chalk from "chalk";
import { fs, NOTES_FILE } from "../config";
import { createAndMergeWithStructure, parseDateStringForValues, getFullNames, createHumanReadableWeekIdentifier } from "./utils";

export const readNotes = async ( forceReadingFromDisk = false ) => fs.read( NOTES_FILE, forceReadingFromDisk );
export const writeNotes = async data => fs.write( NOTES_FILE, data );

export async function addNote( data: {
  note: string;
  dateString: string;
  project: string;
  taskDetail: string;
} ) {
  const { note: noteToAdd, dateString, project, taskDetail } = data;
  const ogNotes = await readNotes( true );

  const [ isoWeek, isoYear, dayOfTheWeek ] = parseDateStringForValues( dateString, "%V %G %a" );
  const structure = {
    [isoYear]: {
      [isoWeek]: {
        [project]: {
          [taskDetail]: {
            [dayOfTheWeek]: "",
          },
        },

      },
    },
  };
  const newNotes = createAndMergeWithStructure( ogNotes, structure, ( cur: string ) => cur === "" ? noteToAdd : `${cur}, ${noteToAdd}` );
  console.log( "Successfully added note" );
  await writeNotes( newNotes );
}

export async function editNote( data: {
  note: string;
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
} ) {
  const { note, project, taskDetail, week, year, dayOfTheWeek } = data;

  const notes = await readNotes( true );
  notes[year][week][project][taskDetail][dayOfTheWeek] = note;
  await writeNotes( notes );
}

export async function removeNote( data: {
  project: string;
  taskDetail: string;
  year: string;
  week: string;
  dayOfTheWeek: string;
} ) {
  const { project, taskDetail, week, year, dayOfTheWeek } = data;

  const notes = await readNotes( true );
  delete notes[year][week][project][taskDetail][dayOfTheWeek];
  await writeNotes( notes );
}

export async function listNotes( dateString: string ) {
  const [ isoWeek, isoYear ] = parseDateStringForValues( dateString, "%V %G" );

  const notes = await readNotes( true );
  const notesData = notes[isoYear][isoWeek];

  const allProjectTaskDetailDOTWCombinations = Object.keys( notesData ).reduce( ( acc: any[], projectKey ) => {
    const taskDetailsDOTWCombinations = Object.keys( notesData[projectKey] ).reduce( ( acc: any[], taskDetailKey ) => {
      const dotwArr = Object.keys( notesData[projectKey][taskDetailKey] );
      dotwArr.forEach( dotw => acc.push( { taskDetailKey, dotw } ) );
      return acc;
    }, [] );

    taskDetailsDOTWCombinations.forEach( obj => acc.push( Object.assign( obj, { projectKey } ) ) );
    return acc;
  }, [] );

  const combinationsGroupedByDOTW = allProjectTaskDetailDOTWCombinations.reduce( ( acc, combi ) => {
    const { dotw } = combi;
    if ( !acc[dotw] )
      acc[dotw] = [ combi ];
    else
      acc[dotw].push( combi );
    return acc;
  }, {} );

  const output = await Promise.all( [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ].map( dotw => {
    if ( !combinationsGroupedByDOTW[dotw] )
      return undefined;
    else
      return combinationsGroupedByDOTW[dotw];
  } ).filter( x => x ).map( async dotwGroup => {
    const { dotw } = dotwGroup[0];

    const theDaysProjectsWithTheirNotesText = await Promise.all( dotwGroup.map( async combi => {
      const { projectKey, taskDetailKey, dotw } = combi;
      const project = await getFullNames.project( projectKey, { style: "hyphen", keyColor: "project" } );
      const taskDetail = await getFullNames.taskDetail( projectKey, taskDetailKey, { style: "hyphen", keyColor: "td" } );
      const projectText = `${project}: ${taskDetail}`;

      const note = notesData[projectKey][taskDetailKey][dotw];
      return `${projectText}
    ${chalk.yellow( note )}`;
    } ) );
    return `${chalk.magenta( dotw )}:
  ${theDaysProjectsWithTheirNotesText.join( `\n  ` )}`;
  } ) ).then( textArr => textArr.join( "\n" ) );

  console.log( `Notes for ${createHumanReadableWeekIdentifier( dateString, { noLeadingProposition: true } )}:\n${output}` );
}
