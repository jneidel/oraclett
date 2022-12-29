import { Command } from "@oclif/core";
import { editProject, readProjects, combineToOracleString, parseOracleString } from "../../controller/project";
import inquirer from "inquirer";

export default class Edit extends Command {
  static summary = "Edit the name of a projects or a projects task detail";
  static description = `Edit the name of a projects or a projects task detail.

Passing no arguments will start an interactive session.`;

  static args = [ {
    name       : "projectCode",
    description: "The project to be edited",
  } ];

  async run(): Promise<void> {
    const { args } = await this.parse( Edit );

    const projects = await readProjects();
    const answers = await inquirer.prompt( [
      {
        type   : "expand",
        name   : "whatToEdit",
        message: "Do you want to edit a project or a projects task detail?",
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
          return !args.projectCode && answers.whatToEdit === "taskDetail";
        },
      },
      {
        type   : "list",
        name   : "taskDetailToBeEdited",
        message: "Select the task detail to edit",
        choices( answers ) {
          const projectCode = args.projectCode ? args.projectCode : answers.project;

          return Object.keys( projects[projectCode].taskDetails ).map( key => ( { name: combineToOracleString( key, projects[projectCode].taskDetails[key].description ) } ) );
        },
        when( answers ) {
          return answers.whatToEdit === "taskDetail";
        },
      },
      {
        type   : "list",
        message: "Select project to edit",
        name   : "projectToBeEdited",
        choices: Object.keys( projects ).map( key => ( { name: combineToOracleString( key, projects[key].description ) } ) ),
        when( answers ) {
          return !args.projectCode && answers.whatToEdit === "project";
        },
      },
      {
        type   : "editor",
        name   : "renamedOption",
        message: "Please rename the value in question",
        default( answers ) {
          if ( answers.whatToEdit === "project" )
            return answers.projectToBeEdited || combineToOracleString( args.projectCode, projects[args.projectCode].description );
          else
            return answers.taskDetailToBeEdited;
        },
      },
    ] ).then( answers => {
      answers.renamedOption = answers.renamedOption.trim();

      if ( args.projectCode ) {
        answers.projectToBeEdited = args.projectCode;
        answers.project = args.projectCode;
      } else if ( answers.whatToEdit === "project" ) {
        // to ensure consistency between tasks and projects
        answers.projectToBeEdited = Object.keys( parseOracleString( answers.projectToBeEdited ) )[0];
      }

      return answers;
    } );

    if ( answers.whatToEdit === "project" )
      editProject( { project: answers.projectToBeEdited, newName: answers.renamedOption } );
    else
      editProject( { project: answers.project, newName: answers.renamedOption, taskDetail: answers.taskDetailToBeEdited } );

  }
}
