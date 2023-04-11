import { Command, Flags } from "@oclif/core";
import Note from "../../data/note";
import { listNotes } from "../../controller/notes";
import { getNoEntriesErrorFunction } from "../../controller/day-week-mode";
import { parseDateStringForValues,
  convertDateShortcutsIntoFullForms,
  hasProjectTaskDetailCombinationsWithEntries } from "../../controller/utils";

const DEFAULT_DATE = "this week";
const SECONDARY_DEFAULT_DATE = "last week";

export default class List extends Command {
  static description = "List all notes.";
  static aliases = [ "note:l" ];
  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : DEFAULT_DATE,
      parse      : convertDateShortcutsIntoFullForms,
    } ),
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week"
` ];

  private async checkIfTimeframeHasData( date: string, throwNoNotesExistError: Function ): Promise<void> {
    const [ isoWeek, isoYear ] = parseDateStringForValues( date, "%V %G" );
    const notes = await Note.readAll()
      .then( notes => notes[isoYear][isoWeek] )
      .catch( () => null );
    if ( !hasProjectTaskDetailCombinationsWithEntries( notes ) )
      return throwNoNotesExistError();

  }

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date } = flags;
    const throwNoNotesExistError = getNoEntriesErrorFunction( date, this.error, "note", "week" );

    try {
      await this.checkIfTimeframeHasData( date, throwNoNotesExistError );
      listNotes( date );
    } catch ( err ) {
      if ( date === DEFAULT_DATE ) {
        await this.checkIfTimeframeHasData( SECONDARY_DEFAULT_DATE, throwNoNotesExistError );
        listNotes( SECONDARY_DEFAULT_DATE );
      } else {
        throw err;
      }
    }
  }
}
