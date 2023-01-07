import { Command } from "@oclif/core";
import { editNote, readNotes } from "../../controller/notes";
import { parseDateStringForValues } from "../../controller/utils";
import * as askFor from "../../controller/questions";
import * as dayWeekMode from "../../controller/day-week-mode";

export default class Edit extends Command {
  static summary = "Edit the your notes interactively.";
  static description = dayWeekMode.helpText;
  static examples = dayWeekMode.examples;

  static flags = {
    date: dayWeekMode.dateFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Edit );
    const dateString = flags.date;

    const [ week, year, dayInQuestion ] = parseDateStringForValues( dateString, "%V %G %a" );
    let operatingMode = dayWeekMode.evalOperatingMode( dateString );
    let throwNoNotesAddedError = dayWeekMode.getNoEntriesErrorFunction( dateString, this.error, "note" );

    const notes = await readNotes();
    if ( !( notes[year] && notes[year][week] ) )
      throwNoNotesAddedError();
    const notesData = notes[year][week];

    if ( dateString === "today" && !dayWeekMode.dayModeHasResults( notesData, dayInQuestion ) ) {
      this.log( "No entries for today. Changing to week mode." );
      operatingMode = "week";
      throwNoNotesAddedError = dayWeekMode.getNoEntriesErrorFunction( "this week", this.error, "note" );
    }

    if ( operatingMode === "day" ) {
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runDayMode( dayInQuestion, notesData, throwNoNotesAddedError );
    } else {
      // @ts-ignore
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runWeekMode( notesData, throwNoNotesAddedError );
    }

    const currentNote = notesData[project][taskDetail][dayOfTheWeek];
    const updatedNote = await askFor.renaming( currentNote, "Please update the notes in your editor:" );

    editNote( { note: updatedNote, project, taskDetail, dateString } );
  }
}
