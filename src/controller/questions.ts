import inquirer from "inquirer";
import { getReadableChoices } from "./utils";
import { validateDateString } from "./validation";

type InquirerChoice = {
  name: string;
  value: string;
}
function handleZeroOrOneChoices( choices: InquirerChoice[]|string[] ) {
  if ( choices.length === 0 ) {
    throw new Error( "Nothing to choose from." );
  }  else if ( choices.length === 1 ) {
    const choice = choices[0];

    if ( typeof choice === "string" ) {
      console.log( `Using ${choice}` );
      return choice;
    } else {
      console.log( `Using ${choice.name}` );
      return choice.value;
    }
  } else { // multiple
    return null;
  }
}

export async function project( selection?: string[] ): Promise<string> {
  const choices = selection ? await getReadableChoices.project( selection ) : await getReadableChoices.project();
  const choice: string|null = handleZeroOrOneChoices( choices );

  if ( choice !== null ) {return new Promise( ( resolve ) => resolve( choice ) );} else {
    return inquirer.prompt( [
      {
        type   : "list",
        name   : "project",
        message: "What project?",
        choices,
      },
    ] ).then( ans => ans.project );
  }
}

export async function taskDetail( projectKey: string, selection?: string[] ): Promise<string> {
  const choices = selection ? await getReadableChoices.taskDetails( projectKey, selection ) : await getReadableChoices.taskDetails( projectKey );
  const choice: string|null = handleZeroOrOneChoices( choices );

  if ( choice !== null ) {return new Promise( ( resolve ) => resolve( choice ) );} else {
    return inquirer.prompt( [ {
      type   : "list",
      name   : "taskDetail",
      message: "What task detail?",
      choices,
    } ] ).then( ans => ans.taskDetail );
  }
}

export async function dayOfTheWeek( choices: string[] ): Promise<string> {
  const choice: string|null = handleZeroOrOneChoices( choices );

  if ( choice !== null ) {return new Promise( ( resolve ) => resolve( choice ) );} else {
    return inquirer.prompt( [ {
      type   : "list",
      name   : "dotw",
      message: "What day of the week?",
      choices,
    } ] ).then( ans => ans.dotw );
  }
}

export async function number( message: string, defaultVal?: number ): Promise<number> {
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

export async function renaming( defaultVal: string,  message = "Please open your editor to rename" ): Promise<string> {
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

export async function text( message: string ): Promise<string> {
  return inquirer.prompt( [ {
    type: "input",
    name: "text",
    message,
  } ] ).then( ans => ans.text.trim() );
}

export async function date( defaultVal = "today" ): Promise<string> {
  return inquirer.prompt( [ {
    type    : "input",
    name    : "date",
    message : "What date?",
    default : defaultVal,
    validate: input => validateDateString( input, true ),
  } ] ).then( ans => ans.date );
}

export async function confirmation( data: { message: string; default: boolean } ): Promise<boolean> {
  return inquirer.prompt( [ {
    type   : "confirm",
    name   : "confirmation",
    message: data.message,
    default: data.default,
  } ] ).then( ans => ans.confirmation );
}

export const renamingHelpText = ( wording ) => `It will ask you to ${wording} in your $EDITOR (in your case: ${process.env.EDITOR}).`;
