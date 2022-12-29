import { Command, Flags } from "@oclif/core";
import { projects } from "../../config";
import inquirer from "inquirer";

export default class Add extends Command {
  static description = "Add a project";

  static examples = [
    `
$ oraclett project add
$ oraclett project add "INTPD999DXD - People Development DXD"
$ oraclett project add "INTPD999DXD - People Development DXD" -t "01 - Career development" -t "03 - Discipline Weeks"
`,
  ];

  static flags = {
    taskDetail: Flags.string( {
      char       : "t",
      description: "A task detail",
      multiple   : true,
      aliases    : [ "task", "detail", "details" ],
    } ),
  };

  static args = [ {
    name       : "project_code",
    description: "The project code",
  } ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse( Add );

    if ( !args.project_code ) {
      const { project_code: projectCode } = await inquirer.prompt( {
        type   : "input",
        name   : "project_code",
        message: "What is the project code you want to add?",
      } );

      const taskDetails: string[] = [];
      const ask = async () => {
        return inquirer.prompt( [
          {
            type   : "input",
            name   : "taskDetails",
            message: "What task details do you want to add?",
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
            return ask();
          else
            return taskDetails;

        } );
      };
      await ask();

      projects.add( projectCode, taskDetails );
    } else {
      projects.add( args.project_code, flags.taskDetail );
    }
  }
}
