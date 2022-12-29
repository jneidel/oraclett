import { Command } from "@oclif/core";
import { removeProject, readProjects, combineToOracleString } from "../../controller/project";
import inquirer from "inquirer";

export default class Remove extends Command {
  static summary = "Remove projects or a projects task details";
  static description = `Remove projects or a projects task details.

Passing no arguments will start an interactive session.`;

  static args = [ {
    name       : "projectCode",
    description: "The project to be remove",
  } ];

  async run(): Promise<void> {
    const { args } = await this.parse( Remove );

    if ( args.projectCode ) {
      removeProject( args.projectCode );
    } else {
      const projects = await readProjects();
      const answers = await inquirer.prompt( [
        {
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
        },
        {
          type   : "list",
          name   : "project",
          message: "What project do you want to remove a Task Detail from?",
          choices: Object.keys( projects ),
          when( answers ) {
            return answers.whatToRemove === "taskDetail";
          },
        },
        {
          type   : "list",
          name   : "taskDetailToBeRemoved",
          message: "Select the task detail to remove",
          choices( answers ) {
            return Object.keys( projects[answers.project].taskDetails ).map( key => ( { name: combineToOracleString( key, projects[answers.project].taskDetails[key].description ), value: key } ) );
          },
          when( answers ) {
            return answers.whatToRemove === "taskDetail";
          },
        },
        {
          type   : "list",
          message: "Select project to remove",
          name   : "projectToBeRemoved",
          choices: Object.keys( projects ).map( key => ( { value: key, name: combineToOracleString( key, projects[key].description ) } ) ),
          when( answers ) {
            return answers.whatToRemove === "project";
          },
        },
      ] );

      if ( answers.whatToRemove === "project" )
        removeProject( answers.projectToBeRemoved );
      else
        removeProject( answers.project, answers.taskDetailToBeRemoved );

    }
  }
}
