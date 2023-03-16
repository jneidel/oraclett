import { Command, Flags } from "@oclif/core";
import { addHoursWithAskingForForceConfirmation } from "../../controller/hours";
import { addNote } from "../../controller/notes";
import * as askFor from "../../controller/questions";
import { interactiveHelpText, convertDateShortcutsIntoFullForms } from "../../controller/utils";
import { validateDateString, validateProject, validateTaskDetails } from "../../controller/validation";

export default class Add extends Command {
  static summary = "Log working hours.";
  static description = `${interactiveHelpText}

This command will add to existing hours. If run twice the hours will be logged doubly.`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -H 3
$ <%= config.bin %> <%= command.id %> -H 3 -p INTPD999DXD -t 01
$ <%= config.bin %> <%= command.id %> -H 3 -p INTPD999DXD -t 01 --date yesterday
$ <%= config.bin %> <%= command.id %> -H 10 -p INTPD999DXD -t 01 -d today --force
$ <%= config.bin %> <%= command.id %> -H2 -pINTPD999DXD -dtoday --note "Onboarding meeting"
` ];

  static flags = {
    taskDetail: Flags.string( {
      char       : "t",
      description: "The task details (in it's short version, e.g. 01)",
      aliases    : [ "task-detail", "task", "detail", "details", "taskDetails", "task-details" ],
    } ),
    project: Flags.string( {
      char       : "p",
      description: "A project code (it it's short version)",
    } ),
    date: Flags.string( {
      char       : "d",
      description: "[default: today] The date for which to log (can be human-readable)",
      parse      : convertDateShortcutsIntoFullForms,
    } ),
    force: Flags.boolean( {
      char       : "f",
      description: "Force logging more than 8h on one workday",
      hidden     : true,
    } ),
    hours: Flags.string( {
      char       : "H",
      description: "The number of hours to log (1h: 1, 30min: 0.5, etc.)",
    } ),
    note: Flags.string( {
      char       : "n",
      description: "Note to be added alongside the hours",
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, taskDetail, date, hours }: any = flags;
    const dontAskForDateInteractively = !date && project && taskDetail && hours;

    if ( hours ) {
      hours = parseFloat( hours );
      if ( isNaN( hours ) )
        this.error( `Hours (-H, --hours) have to be a number.` );
    } else {
      hours = await askFor.number( "How many hours?" );
    }

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

    await addHoursWithAskingForForceConfirmation( { hoursToLog: hours, dateString: date, project, taskDetail, force: flags.force } );
    if (flags.note) {
      addNote( { project, taskDetail, note: flags.note, dateString: date } );
    }
  }
}
