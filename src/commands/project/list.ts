import { Command, Flags } from "@oclif/core";
import { listProjects } from "../../controller/project";

export default class List extends Command {
  static description = "List all projects.";

  static flags = {
    full: Flags.boolean( {
      char       : "f",
      description: "Show the full list of task details",
      aliases    : [ "all" ],
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( List );

    listProjects( { full: flags.full } );
  }
}
