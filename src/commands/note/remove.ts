import { Command } from "@oclif/core";
import Note from "../../data/note";
import { removeNote } from "../../controller/notes";
import { parseDateStringForValues } from "../../controller/utils";
import * as askFor from "../../controller/questions";
import * as dayWeekMode from "../../controller/day-week-mode";

export default class Remove extends Command {
  static summary = "Remove your notes interactively.";
  static description = dayWeekMode.helpText;
  static examples = dayWeekMode.examples;
  static aliases = [ "note:delete", "note:r", "note:d" ];
  static flags = {
    date: dayWeekMode.dateFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Remove );
    const dateString = flags.date;

    const [ week, year, dayInQuestion ] = parseDateStringForValues( dateString, "%V %G %a" );
    let operatingMode = dayWeekMode.evalOperatingMode( dateString );
    let throwNoNotesAddedError = dayWeekMode.getNoEntriesErrorFunction( dateString, this.error, "note" );

    const notes = await Note.readAll();
    if ( !( notes[year] && notes[year][week] ) )
      throwNoNotesAddedError();
    const notesData = notes[year][week];

    if ( dateString === "today" && !dayWeekMode.dayModeHasResults( notesData, dayInQuestion ) ) {
      this.log( "No entries for today. Changing to week mode." );
      operatingMode = "week";
      throwNoNotesAddedError = dayWeekMode.getNoEntriesErrorFunction( "this week", this.error, "note" );
    }

    if ( operatingMode === "day" )
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runDayMode( dayInQuestion, notesData, throwNoNotesAddedError );
    else
      // @ts-ignore
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runWeekMode( notesData, throwNoNotesAddedError );


    const currentNote = notesData[project][taskDetail][dayOfTheWeek];
    const confirmDeletion = await askFor.confirmation( {
      message: `Execute deletion of this note?\n  Note: ${currentNote}`,
      default: true,
    } );

    if ( confirmDeletion )
      removeNote( { project, taskDetail, year, week, dayOfTheWeek } );
  }
}
