import { fs, NOTES_FILE } from "../config";
import { createAndMergeWithStructure, parseDateStringForValues } from "./utils";

export const readNotes = async ( forceReadingFromDisk = false ) => fs.read( NOTES_FILE, forceReadingFromDisk );
const writeNotes = async data => fs.write( NOTES_FILE, data );

export async function addNotes( data: {
  noteToAdd: number|any;
  dateString: string|any;
  project: string|any;
  taskDetails: string|any;
} ) {
  const { noteToAdd, dateString, project, taskDetails } = data;
  const ogNotes = await readNotes( true );

  const [ isoWeek, isoYear, dayOfTheWeek ] = parseDateStringForValues( dateString, "%V %G %a" );
  const structure = {
    [isoYear]: {
      [isoWeek]: {
        [project]: {
          [taskDetails]: {
            [dayOfTheWeek]: [],
          },
        },

      },
    },
  };
  const newNotes = createAndMergeWithStructure( ogNotes, structure, ( a: string[] ) => { a.push( noteToAdd ); return a; } );

  console.log( JSON.stringify( newNotes, null, 2 ) );

  // await writeNotes( newHours );
}
