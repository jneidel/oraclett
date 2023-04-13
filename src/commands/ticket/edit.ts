import { Command, Flags } from "@oclif/core";
import { editTicket } from "../../controller/ticket";

export default class Add extends Command {
  static summary = "Edit an existing ticket";
  static description = `Edit the id or title of a ticket.`;

  static examples = [ `# edit interactively
$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> --id AAKKK001-1337
# edit title
$ <%= config.bin %> <%= command.id %> -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
# edit id
$ <%= config.bin %> <%= command.id %> -i AAKKK001-1337 --new-id BBJJJ002-1337 -p INTPD999DXD
` ];

  static flags = {
    title: Flags.string( {
      char       : "t",
      description: "Title of the ticket",
    } ),
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
    "new-id": Flags.string( {
      description: "New identifier for the '--id' to be changed to",
      aliases    : [ "newId" ],
    } ),
  };
  static aliases = [ "ticket:a" ];

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    const { project, id, title, "new-id": newId } = flags;

    await editTicket( { project, id, title, newId } );
  }
}
