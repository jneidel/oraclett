import { Command, Flags } from "@oclif/core";
import { addTicket, listTicketsByProject } from "../../controller/ticket";
import { validateProject } from "../../controller/validation";
import * as askFor from "../../controller/questions";
import { applyColor } from "../../controller/utils";

export default class Add extends Command {
  static summary = "Add a new ticket";
  static description = `Create a ticket to be matched and expanded in note-taking.`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> --id AAKKK001-1337
$ <%= config.bin %> <%= command.id %> -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
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
  };
  static aliases = [ "ticket:a" ];

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, title, id }: any = flags;

    if ( project )
      await validateProject( project );
    else
      project = await askFor.project()
        .catch( () => this.error( `No projects have been added.

To add a new one: project add` ) );

    if ( !id )
      id = await askFor.text( "Whats the identifier for the ticket?" );
    if ( !title )
      title = await askFor.text( "What the tickets title?" );

    await addTicket( { project, id, title } )
      .then( () => this.log( `Successfully added ${applyColor( "ticket", id )} to ${applyColor( "project", project )}!` ) )
      .then( () => listTicketsByProject( project ) );
  }
}
