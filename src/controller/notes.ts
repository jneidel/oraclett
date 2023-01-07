import { fs, NOTES_FILE } from "../config";
import { createAndMergeWithStructure, parseDateStringForValues } from "./utils";

export const readNotes = async ( forceReadingFromDisk = false ) => fs.read( NOTES_FILE, forceReadingFromDisk );
const writeNotes = async data => fs.write( NOTES_FILE, data );

export async function addNote( data: {
  note: number|any;
  dateString: string|any;
  project: string|any;
  taskDetail: string|any;
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
  const newNotes = createAndMergeWithStructure( ogNotes, structure, ( a: string ) => a === "" ? noteToAdd : `${a}; ${noteToAdd}` );
  await writeNotes( newNotes );
}

export async function editNote( data: {
  note: number|any;
  dateString: string|any;
  project: string|any;
  taskDetail: string|any;
} ) {
  const { note: note, dateString, project, taskDetail } = data;
  const [ week, year, dayOfTheWeek ] = parseDateStringForValues( dateString, "%V %G %a" );

  const notes = await readNotes( true );
  notes[year][week][project][taskDetail][dayOfTheWeek] = note;

  console.log( JSON.stringify( notes, null, 2 ) );
}
