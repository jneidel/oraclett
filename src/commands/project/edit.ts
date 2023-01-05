import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { editProject } from "../../controller/project";
import { interactiveHelpText, getReadableChoices, getFullNames } from "../../controller/utils";

export default class Edit extends Command {
  static summary = "Edit the name of a projects or a projects task detail.";
  static description = interactiveHelpText;

  static args = [ {
    name       : "projectCode",
    description: "The project to be edited",
  } ];

  async run(): Promise<void> {
    const { args } = await this.parse( Edit );

    const { whatToEdit }: { whatToEdit: "project"|"taskDetail" } = await inquirer.prompt( [ {
      type   : "expand",
      name   : "whatToEdit",
      message: "Do you want to edit a Project or the Task details of a project?",
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

    let projectKey = args.projectCode;
    if ( !projectKey ) {
      await inquirer.prompt( [ {
        type   : "list",
        name   : "project",
        message: "What project?",
        choices: () => getReadableChoices.project(),
      } ] ).then( ans => projectKey = ans.project );
    }

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
