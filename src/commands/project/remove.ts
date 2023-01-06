import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { removeProject } from "../../controller/project";
import { getReadableChoices } from "../../controller/utils";

export default class Remove extends Command {
  static summary = "Remove a project or a projects task details interactively.";

  async run(): Promise<void> {
    const { whatToRemove }: { whatToRemove: "project"|"taskDetail" } = await inquirer.prompt( [ {
      type   : "list",
      name   : "whatToRemove",
      message: "What do you want to remove?",
      choices: [
        {
          key  : "p",
          name : "Project",
          value: "project",
        },
        {
          key  : "t",
          name : "Task Details (of a project)",
          value: "taskDetail",
        },
      ],
    } ] );

    const projectKey = await inquirer.prompt( [ {
      type   : "list",
      name   : "project",
      message: "What project?",
      choices: () => getReadableChoices.project(),
    } ] ).then( ans => ans.project );

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
