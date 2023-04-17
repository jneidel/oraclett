import { Command, Flags } from "@oclif/core";
import { addNote } from "../../controller/notes";
import { addHoursWithAskingForForceConfirmation } from "../../controller/hours";
import { validateDateString, validateProject, validateTaskDetails } from "../../controller/validation";
import { interactiveHelpText, convertDateShortcutsIntoFullForms } from "../../controller/utils";
import * as askFor from "../../controller/questions";

export default class Add extends Command {
  static summary = "Note down what you worked on.";
  static description = `${interactiveHelpText}

This will add to existing notes for the same day.`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -n "This and that" -p INTPD999DXD
$ <%= config.bin %> <%= command.id %> -n "This and that" -p INTPD999DXD -t 01 --date yesterday
$ <%= config.bin %> <%= command.id %> -n "Worked 5h with Node" -H5 -pINTPD999DXD -t01 -dtoday
` ];

  static flags = {
    taskDetail: Flags.string( {
      char       : "t",
      description: "The details of a task (in it's short version, e.g. 01)",
      aliases    : [ "task-detail", "task", "detail", "details", "taskDetails", "task-details" ],
    } ),
    project: Flags.string( {
      char       : "p",
      description: "A project code (it it's short version)",
    } ),
    date: Flags.string( {
      char       : "d",
      description: "The date for which to log (can be human-readable)",
      parse      : convertDateShortcutsIntoFullForms,
    } ),
    note: Flags.string( {
      char       : "n",
      description: "Note to add",
    } ),
    hours: Flags.string( {
      char       : "H",
      description: "Hours to be logged alongside the note",
    } ),
    dontMatchNumbers: Flags.boolean( {
      default    : false,
      description: "Disable number-based matching (4+ numbers)",
      helpGroup  : "NEW TICKET MATCHING",
    } ),
    dontMatchProject: Flags.boolean( {
      default    : false,
      description: "Disable project-based matching (project key + postfix)",
      helpGroup  : "NEW TICKET MATCHING",
    } ),
    dontMatchTickets: Flags.boolean( {
      default    : false,
      description: "Disable all checking for new tickets",
      helpGroup  : "NEW TICKET MATCHING",
    } ),
  };
  static aliases = [ "note:a" ];

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, taskDetail, date, note, dontMatchNumbers, dontMatchTickets, dontMatchProject }: any = flags;
    const dontAskForDateInteractively = !date && project && taskDetail && note;

    if ( project )
      await validateProject( project );
    else
      project = await askFor.project()
        .catch( () => this.error( `No projects have been added.

To add a new one: project add` ) );


    if ( taskDetail )
      await validateTaskDetails( project, taskDetail );
    else
      taskDetail = await askFor.taskDetail( project );

    if ( dontAskForDateInteractively )
      date = "today";
    else if ( date )
      validateDateString( date );
    else
      date = await askFor.date( "today" );

    if ( !note )
      note = await askFor.text( "Note:" );

    await addNote( { project, taskDetail, note, dateString: date, dontMatchNumbers, dontMatchProject, dontMatchTickets } );

    if ( flags.hours ) {
      const hoursToLog = parseFloat( flags.hours );
      if ( isNaN( hoursToLog ) )
        this.error( `Hours (-H, --hours) have to be a number.` );

      addHoursWithAskingForForceConfirmation( { hoursToLog, dateString: date, project, taskDetail, force: false } );
    }
  }
}
