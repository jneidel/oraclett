import { Command, Flags } from "@oclif/core";
import { listHours } from "../../controller/hours";
import { validateDateString } from "../../controller/validation";

export default class List extends Command {
  static description = "List all projects.";

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : "this week",
    } ),
    short: Flags.boolean( {
      char       : "s",
      description: "Show shortend titles for the projects (for smaller terminals)",
      default    : false,
    } ),
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week" --short
` ];

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date, short } = flags;

    validateDateString( date );

    listHours( date, short );
  }
}
