import { Command, Flags } from "@oclif/core";
import { removeTicket } from "../../controller/ticket";

export default class Remove extends Command {
  static summary = "Remove a ticket";
  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> --id AAKKK001-1337 -p INTPD999DXD
` ];

  static flags = {
    id: Flags.string( {
      char       : "i",
      description: "Identifier of the ticket",
      aliases    : [ "ticketId" ],
    } ),
    project: Flags.string( {
      char       : "p",
      description: "Project this ticket belongs to",
      aliases    : [ "projectKey" ],
    } ),
  };
  static aliases = [ "ticket:d", "ticket:r", "ticket:delete" ];

  async run(): Promise<void> {
    const { flags } = await this.parse( Remove );
    const { project, id } = flags;

    await removeTicket( { project, id } );
  }
}
