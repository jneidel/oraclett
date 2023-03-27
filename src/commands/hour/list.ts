import { Command, Flags } from "@oclif/core";
import { listHours, readHours } from "../../controller/hours";
import { getNoEntriesErrorFunction } from "../../controller/day-week-mode";
import { parseDateStringForValues,
  convertDateShortcutsIntoFullForms,
  hasProjectTaskDetailCombinationsWithEntries } from "../../controller/utils";

const DEFAULT_DATE = "this week";
const SECONDARY_DEFAULT_DATE = "last week";

export default class List extends Command {
  static description = "List all logged hours.";

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : DEFAULT_DATE,
      parse      : convertDateShortcutsIntoFullForms,
    } ),
    short: Flags.boolean( {
      char       : "s",
      description: "Show shortend titles for the projects (for smaller terminals)",
      default    : false,
    } ),
  };
  static aliases = [ "hour:l" ];

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week" --short
` ];

  private async checkIfTimeframeHasData( date: string, throwNoHoursExistError: Function ): Promise<void> {
    const [ isoWeek, isoYear ] = parseDateStringForValues( date, "%V %G" );
    const hours = await readHours()
      .then( hours => hours[isoYear][isoWeek] )
      .catch( () => null );
    if ( !hasProjectTaskDetailCombinationsWithEntries( hours ) )
      return throwNoHoursExistError();
  }

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date, short } = flags;
    const throwNoHoursExistError = getNoEntriesErrorFunction( date, this.error, "hours", "week" );

    try {
      await this.checkIfTimeframeHasData( date, throwNoHoursExistError );
      listHours( date, short );
    } catch ( err ) {
      if ( date === DEFAULT_DATE ) {
        await this.checkIfTimeframeHasData( SECONDARY_DEFAULT_DATE, throwNoHoursExistError );
        listHours( SECONDARY_DEFAULT_DATE, short );
      } else {
        throw err;
      }
    }
  }
}
