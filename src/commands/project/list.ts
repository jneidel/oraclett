import { Command, Flags } from "@oclif/core";
import { listProjects } from "../../controller/project";

export default class List extends Command {
  static description = "List all projects.";

  static flags = {
    filter: Flags.string( {
      char       : "f",
      description: "Filter for a project code",
      aliases    : [ "code" ],
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( List );

    listProjects( flags.filter );
  }
}
