import { Command, Flags } from "@oclif/core";
import { listTickets, listTicketsByProject } from "../../controller/ticket";
import { validateProject } from "../../controller/validation";

export default class Add extends Command {
  static summary = "List tickets";
  static description = `List the existing tickets (per project).`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -p INTPD999DXD
` ];

  static flags = {
    project: Flags.string( {
      char       : "p",
      description: "Project to filter the tickets by",
      aliases    : [ "projectKey" ],
    } ),
  };
  static aliases = [ "ticket:l" ];

  async run(): Promise<void> {
    const { flags: { project } } = await this.parse( Add );

    if ( project ) {
      await validateProject( project );
      await listTicketsByProject( project );
    } else {
      await listTickets();
    }
  }
}
