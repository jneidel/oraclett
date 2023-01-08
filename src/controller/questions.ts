import inquirer from "inquirer";
import { getReadableChoices } from "./utils";
import { validateDateString } from "./validation";

export async function project( selection? ) {
  return inquirer.prompt( [
    {
      type   : "list",
      name   : "project",
      message: "What project?",
      choices: () => {
        if ( selection )
          return getReadableChoices.project( selection );
        else
          return getReadableChoices.project();
      },
    },
  ] ).then( ans => ans.project );
}

export async function taskDetail( projectKey, selection? ) {
  return inquirer.prompt( [ {
    type   : "list",
    name   : "taskDetail",
    message: "What task detail?",
    choices: () => {
      if ( selection )
        return getReadableChoices.taskDetails( projectKey, selection );
      else
        return getReadableChoices.taskDetails( projectKey );
    },
  } ] ).then( ans => ans.taskDetail );
}

export async function dayOfTheWeek( choices: any[] ) {
  return inquirer.prompt( [ {
    type   : "list",
    name   : "dotw",
    message: "What day of the week?",
    choices,
  } ] ).then( ans => ans.dotw );
}

export async function number( message: string, defaultVal?: number ) {
  return inquirer.prompt( [ {
    type   : "number",
    name   : "n",
    message,
    default: defaultVal,
    validate( value ) {
      const valid = !isNaN( parseFloat( value ) );
      return valid || "Please enter a number";
    },
  } ] ).then( ans => ans.n );
}

export async function renaming( defaultVal: string,  message = "Please open your editor to rename" ) {
  return inquirer.prompt( [ {
    type   : "editor",
    name   : "updated",
    message,
    default: defaultVal,
  } ] ).then( ans => ans.updated.trim() );
}

export async function projectOrTaskDetail( message: string ): Promise<"project"|"taskDetail"> {
  return inquirer.prompt( [ {
    type   : "list",
    name   : "what",
    message,
    choices: [
      {
        name : "Project Name",
        value: "project",
      },
      {
        name : "Task Details (of a project)",
        value: "taskDetail",
      },
    ],
  } ] ).then( ans => ans.what );
}

export async function text( message: string ) {
  return inquirer.prompt( [ {
    type: "input",
    name: "text",
    message,
  } ] ).then( ans => ans.text.trim() );
}

export async function date( defaultVal = "today" ) {
  return inquirer.prompt( [ {
    type    : "input",
    name    : "date",
    message : "What date?",
    default : defaultVal,
    validate: input => validateDateString( input, true ),
  } ] ).then( ans => ans.date );
}

export async function confirmation( data: { message: string; default: boolean } ) {
  return inquirer.prompt( [ {
    type   : "confirm",
    name   : "confirmation",
    message: data.message,
    default: data.default,
  } ] ).then( ans => ans.confirmation );
}

export const renamingHelpText = ( wording ) => `It will ask you to ${wording} in your $EDITOR (in your case: ${process.env.EDITOR}).`;
