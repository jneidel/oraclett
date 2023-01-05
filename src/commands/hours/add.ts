import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { interactiveHelpText, getReadableChoices } from "../../controller/utils";
import { addHours } from "../../controller/hours";
import { validateDateString, validateProject, validateTaskDetails } from "../../controller/validation";

export default class Add extends Command {
  static summary = "Log working hours.";
  static description = `${interactiveHelpText}

This will add to existing hours, you if this command is run twice the hours logged will be double.`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> 3
$ <%= config.bin %> <%= command.id %> 3 -p INTPD999DXD -t 01
$ <%= config.bin %> <%= command.id %> 3 -p INTPD999DXD -t 01 --date yesterday
$ <%= config.bin %> <%= command.id %> 10 -p INTPD999DXD -t 01 -d today -f
` ];
  static aliases = [ "hours:log" ];

  static flags = {
    taskDetails: Flags.string( {
      char       : "t",
      description: "The details of a task (in it's short version, e.g. 01)",
      aliases    : [ "task", "detail", "details" ],
    } ),
    project: Flags.string( {
      char       : "p",
      description: "A project code (it it's short version)",
    } ),
    date: Flags.string( {
      char       : "d",
      description: "The date for which to log (defaults to today, can be human-readable)",
    } ),
    force: Flags.boolean( {
      char       : "f",
      description: "Force logging more than 8h on one workday",
      hidden     : true,
    } ),
    hours: Flags.string( {
      char       : "H",
      description: "The number of hours to log. (1h: 1, 30min: 0.5, etc.)",
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, taskDetails, date, hours }: any = flags;
    if ( hours )
      hours = Number( hours );

    if ( !project || !taskDetails || !date || !hours ) {
      if ( project )
        await validateProject( project );
      const answers = await inquirer.prompt( [
        {
          type   : "number",
          name   : "hours",
          message: "How many hours?",
          when   : () => !hours,
          validate( value ) {
            const valid = !isNaN( parseFloat( value ) );
            return valid || "Please enter a number";
          },
        },
        {
          type   : "list",
          name   : "project",
          message: "Project code?",
          choices: () => getReadableChoices.project(),
          when   : () => !project,
        },
        {
          type   : "list",
          name   : "taskDetail",
          message: "Which task details apply?",
          choices: answers => getReadableChoices.taskDetails( project || answers.project ),
          when   : () => !taskDetails,
        },
        {
          type    : "input",
          name    : "date",
          message : "For what date?",
          default : "today",
          when    : () => !date,
          validate: input => validateDateString( input, true ),
        },
      ] );

      if ( answers.project )
        project = answers.project;
      if ( answers.taskDetail )
        taskDetails = answers.taskDetail;
      if ( answers.date )
        date = answers.date;
      if ( answers.hours )
        hours = answers.hours;
    }

    try {
      validateDateString( date );
      await validateTaskDetails( project, taskDetails );
      await addHours( { hoursToLog: hours, dateString: date, project, taskDetails, force: flags.force } );
    } catch ( err: any ) {
      if ( err.message.match( /--force/ ) ) {

        const combinedHours = err.message.split( " " )[0];
        const force = await inquirer.prompt( [ {
          type   : "confirm",
          name   : "force",
          message: `You are attempting to log a combined ${combinedHours} hours for a workday. Continue?`,
        } ] ).then( answers => answers.force );
        if ( force )
          await addHours( { hoursToLog: hours, dateString: date, project, taskDetails, force } );
      } else {this.error( err.message );}
    }
  }
}
