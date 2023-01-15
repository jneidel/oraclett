import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { addProject } from "../../controller/project";
import { interactiveHelpText } from "../../controller/utils";

export default class Add extends Command {
  static summary = "Add a project code.";
  static description = `${interactiveHelpText}

Copy paste the values from Oracle.
A project code will look like this: INTPD999DXD - People Development DXD
And the task details will like this: 01 - Career development`;

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -p "INTPD999DXD - People Development DXD"
$ <%= config.bin %> <%= command.id %> -t "01 - Career development" -t "03 - Discipline Weeks" -p "INTPD999DXD - People Development DXD"
` ];

  static flags = {
    taskDetail: Flags.string( {
      char       : "t",
      description: "A task detail",
      multiple   : true,
      aliases    : [ "task-detail", "task", "detail", "details", "taskDetails", "task-details" ],
    } ),
    project: Flags.string( {
      char       : "p",
      description: "The project code",
    } ),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Add );
    let { project, taskDetail }: {project: any; taskDetail: string[]|undefined} = flags;
    const taskDetails: string[] = taskDetail || [];

    if ( !project || !taskDetail ) {
      await inquirer.prompt( {
        type   : "input",
        name   : "project",
        message: "What is the project code you want to add?",
        when   : () => !project,
      } ).then( answers => {
        if ( answers.project )
          project = answers.project;
      } );

      const askLoop = async () => {
        return inquirer.prompt( [
          {
            type   : "input",
            name   : "taskDetails",
            message: "Add a task detail:",
          },
          {
            type   : "confirm",
            name   : "askAgain",
            message: "Do you want to add another task detail to the project code?",
            default: false,
          },
        ] ).then( ( answers ) => {
          taskDetails.push( answers.taskDetails );
          if ( answers.askAgain )
            return askLoop();
          else
            return taskDetails;
        } );
      };

      if ( taskDetails.length !== 0 ) {
        const { shouldAdd } = await inquirer.prompt( [ {
          type   : "confirm",
          name   : "shouldAdd",
          message: "Do you want to add another task detail to the project code?",
          default: false,
        } ] );
        if ( shouldAdd )
          await askLoop();
      } else {
        await askLoop();
      }
    }
    addProject( project, taskDetails );
  }
}
