import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { removeProject } from "../../controller/project";
import { interactiveHelpText, getReadableChoices } from "../../controller/utils";

export default class Remove extends Command {
  static summary = "Remove projects or a projects task details.";
  static description = interactiveHelpText;

  static args = [ {
    name       : "projectCode",
    description: "The project to be remove",
  } ];

  async run(): Promise<void> {
    const { args } = await this.parse( Remove );

    const { whatToRemove }: { whatToRemove: "project"|"taskDetail" } = await inquirer.prompt( [ {
      type   : "expand",
      name   : "whatToRemove",
      message: "Do you want to remove a project or a projects task detail?",
      choices: [
        {
          key  : "p",
          name : "Project",
          value: "project",
        },
        {
          key  : "t",
          name : "Task Detail",
          value: "taskDetail",
        },
      ],
    } ] );

    let projectKey = args.projecCode;
    if ( !projectKey ) {
      await inquirer.prompt( [ {
        type   : "list",
        name   : "project",
        message: "What project?",
        choices: () => getReadableChoices.project(),
      } ] ).then( ans => projectKey = ans.project );
    }

    if ( whatToRemove === "project" ) {
      removeProject( projectKey, taskDetailKey );
    } else {
      var { taskDetailKey } = await inquirer.prompt( [ {
        type   : "list",
        name   : "taskDetailKey",
        message: "What task detail?",
        choices: () => getReadableChoices.taskDetails( projectKey ),
      } ] );

      removeProject( projectKey, taskDetailKey );
    }
  }
}
