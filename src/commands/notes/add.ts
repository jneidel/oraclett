import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { interactiveHelpText, getReadableChoices } from "../../controller/utils";
import { addHours } from "../../controller/hours";
import { validateDateString, validateProject, validateTaskDetails } from "../../controller/validation";

export default class Add extends Command {
  static summary = "Log working hours.";
  static description = `${interactiveHelpText}

This will add to existing hours, if this command is run twice the hours logged will be doubly.`;

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
    note: Flags.string( {
      char       : "n",
      description: "Note to add",
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, taskDetails, date, note }: any = flags;
  }
}
