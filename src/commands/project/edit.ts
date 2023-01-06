import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { editProject } from "../../controller/project";
import { getReadableChoices, getFullNames } from "../../controller/utils";

export default class Edit extends Command {
  static summary = "Edit the names interactively.";
  static description = `Allows for renaming a projects or their task details.`;

  async run(): Promise<void> {
    const { whatToEdit }: { whatToEdit: "project"|"taskDetail" } = await inquirer.prompt( [ {
      type   : "list",
      name   : "whatToEdit",
      message: "What do you want to edit?",
      choices: [
        {
          key  : "p",
          name : "Project Name",
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

    let valueToEdit: string;
    if ( whatToEdit === "project" ) {
      valueToEdit = await getFullNames.project( projectKey );
    } else {
      var { taskDetailKey } = await inquirer.prompt( [ {
        type   : "list",
        name   : "taskDetailKey",
        message: "What task detail?",
        choices: () => getReadableChoices.taskDetails( projectKey ),
      } ] );
      valueToEdit = await getFullNames.taskDetail( projectKey, taskDetailKey );
    }

    const renamedValue = await inquirer.prompt( [ {
      type   : "editor",
      name   : "renamedValue",
      message: "Please open your editor to rename",
      default: valueToEdit,
    } ] ).then( ans => ans.renamedValue.trim() );

    if ( whatToEdit === "project" )
      editProject( { project: projectKey, newName: renamedValue } );
    else
      editProject( { project: projectKey, newName: renamedValue, taskDetail: taskDetailKey } );
  }
}
