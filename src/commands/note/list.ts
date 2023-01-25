import { Command, Flags } from "@oclif/core";
import { listNotes, readNotes } from "../../controller/notes";
import { getNoEntriesErrorFunction } from "../../controller/day-week-mode";
import { parseDateStringForValues } from "../../controller/utils";

export default class List extends Command {
  static description = "List all notes.";

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : "this week",
    } ),
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week"
` ];

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date } = flags;

    const [ isoWeek, isoYear ] = parseDateStringForValues( date, "%V %G" );
    const throwNoNotesExistError = getNoEntriesErrorFunction( date, this.error, "note", "week" );

    const notes = await readNotes();
    if ( !notes[isoYear] || !notes[isoYear][isoWeek] )
      return throwNoNotesExistError();

    listNotes( date );
  }
}
