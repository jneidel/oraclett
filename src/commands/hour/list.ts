import { Command, Flags } from "@oclif/core";
import { listHours, readHours } from "../../controller/hours";
import { getNoEntriesErrorFunction } from "../../controller/day-week-mode";
import { parseDateStringForValues,
  convertDateShortcutsIntoFullForms,
  hasProjectTaskDetailCombinationsWithEntries } from "../../controller/utils";

export default class List extends Command {
  static description = "List all logged hours.";

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : "this week",
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

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date, short } = flags;

    const [ isoWeek, isoYear ] = parseDateStringForValues( date, "%V %G" );
    const throwNoHoursExistError = getNoEntriesErrorFunction( date, this.error, "hours", "week" );
    const hours = await readHours()
      .then( hours => hours[isoYear][isoWeek] )
      .catch( () => null );
    if ( !hasProjectTaskDetailCombinationsWithEntries( hours ) )
      return throwNoHoursExistError();

    listHours( date, short );
  }
}
