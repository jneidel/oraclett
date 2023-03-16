import chalk from "chalk";
const { Date } = require( "sugar" );
import { readProjects } from "./project";
import { validateDateString } from "./validation";

export function parseOracleString( str: string ) {
  const match = str.match( /(.+) - (.*)/ );
  if ( match )
    return { [match[1]]: { description: match[2] } };
  else
    return { [str]: { description: null } };
}

const colors = {
  project   : "#00ff5f",
  taskDetail: "#005fd7",
};

type FullNameOptions = {
  style?: "parens"|"hyphen";
  keyColor?: string;
}
const fullNameOptionsDefaults = {
  style   : "hyphen",
  keyColor: "",
};
export function combineIntoFullName( key: string, description: string|null, options: FullNameOptions = {} ): string {
  let { style, keyColor } = Object.assign( fullNameOptionsDefaults, options );

  switch ( keyColor ) {
    case "project":
      keyColor = colors.project;
      break;
    case "td":
      keyColor = colors.taskDetail;
      break;
  }
  const coloredKey = keyColor !== "" ? chalk.hex( keyColor )( key ) : key;

  if ( description === null )
    return coloredKey;
  else
    switch ( style ) {
      case "hyphen":
        return `${coloredKey} - ${description}`;
      case "parens":
        return `${coloredKey} (${description})`;
    }

}

async function getFullProjectName( projectKey: string, options: FullNameOptions = {} ): Promise<string> {
  return readProjects()
    .then( res => res[projectKey] )
    .then( project => {
      if ( !project )
        throw new Error( `Project by the name of ${projectKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      else
        return combineIntoFullName( projectKey, project.description, options );

    } );
}
async function getFullTaskDetailName( projectKey: string, taskDetailKey: string, options: FullNameOptions = {} ): Promise<string> {
  return readProjects()
    .then( res => res[projectKey] )
    .then( project => {
      if ( !project )
        throw new Error( `Project by the name of ${projectKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      else
        return project;

    } )
    .then( project => project.taskDetails[taskDetailKey] )
    .then( taskDetail => {
      if ( !taskDetail )
        throw new Error( `Task detail by the name of ${taskDetailKey} does not exist.
Did you add it?

To add new projects: project add
To list existing projects: project list` );
      else
        return combineIntoFullName( taskDetailKey, taskDetail.description, options );

    } );
}

export const interactiveHelpText = `Passing no arguments will start an interactive session.`;

async function getReadableProjectChoices( selection: String[]|null = null ): Promise<Array<{name: string; value: string}>> {
  const projects = await readProjects();

  return Promise.all( Object.keys( projects ).reverse() // sort by recently added/updated
    .filter( key => {
      if ( selection === null )
        return true;
      else
        return selection.includes( key );
    } )
    .map( async projectKey => {
      const projectName = await getFullProjectName( projectKey, { style: "hyphen" } );
      return {
        name : projectName,
        value: projectKey,
      };
    } ) );
}
async function getReadableTaskDetailChoices( projectCode: string, selection: String[]|null = null ): Promise<Array<{name: string; value: string}>> {
  const projects = await readProjects();

  return Promise.all( Object.keys( projects[projectCode].taskDetails ).sort()
    .filter( key => {
      if ( selection === null )
        return true;
      else
        return selection.includes( key );
    } )
    .map( async taskDetailKey => {
      const taskDetailName = await getFullTaskDetailName( projectCode, taskDetailKey, { style: "hyphen" } );
      return {
        name : taskDetailName,
        value: taskDetailKey,
      };
    } ) );
}
export const getReadableChoices = {
  project    : getReadableProjectChoices,
  taskDetails: getReadableTaskDetailChoices,
};
export const getFullNames = {
  project   : getFullProjectName,
  taskDetail: getFullTaskDetailName,
};

type AddNumbers = ( a: number ) => number;
type AddStrings = ( a: string ) => string;

export function createAndMergeWithStructure( source, structureToMerge, addDataFunc: AddNumbers|AddStrings ) {
  const key = Object.keys( structureToMerge )[0];
  if ( typeof structureToMerge[key] !== "object" || Array.isArray( structureToMerge[key] ) ) {
    if ( !source[key] )
      source[key] = structureToMerge[key];

    // @ts-ignore
    source[key] = addDataFunc( source[key] );

    return source;
  } else {
    let newSource = source;
    if ( typeof source[key] !== "object" )
      newSource  = Object.assign( source, structureToMerge );

    newSource[key] = createAndMergeWithStructure( newSource[key], structureToMerge[key], addDataFunc );
    return newSource;
  }
}

export function parseDateStringForValues( dateString: string, formatString: string ): string[] {
  validateDateString( dateString );
  const date = Date.create( dateString );
  return Date.format( date, formatString ).split( " " );
}

export function createHumanReadableWeekIdentifier( dateString: string, options: { noLeadingProposition?: boolean } = {} ) {
  const { noLeadingProposition } = options;
  if ( noLeadingProposition )
    return createHumanReadableWeekIdentifier( dateString ).split( " " ).slice( 1 ).join( " " );


  const date = Date.create( dateString );
  const [ isoWeek, isoYear ] = Date.format( date, "%V %G" ).split( " " );

  const firstDayOfTheWeek = Date.format( Date.beginningOfISOWeek( date ), "%h%d" );
  const lastDayOfTheWeek = Date.format( Date.endOfISOWeek( date ), "%h%d" );
  const weekInRealDates = ` (${firstDayOfTheWeek} - ${lastDayOfTheWeek})`;

  const getWeekYearCombi = dateString => Date.format( Date.create( dateString ), "%V %G" );
  switch ( `${isoWeek} ${isoYear}` ) {
    case getWeekYearCombi( "now" ):
      return `for this week${  weekInRealDates}`;
    case getWeekYearCombi( "next week" ):
      return `for next week${  weekInRealDates}`;
    case getWeekYearCombi( "last week" ):
      return `for last week${  weekInRealDates}`;
    case getWeekYearCombi( "2 weeks ago" ):
      return `in week ${isoWeek} of ${isoYear} (2 weeks ago)${  weekInRealDates}`;
    case getWeekYearCombi( "3 weeks ago" ):
      return `in week ${isoWeek} of ${isoYear} (3 weeks ago)${  weekInRealDates}`;
    default:
      return `in week ${isoWeek} of ${isoYear}${  weekInRealDates}`;
  }
}

export async function convertDateShortcutsIntoFullForms( input: string ) {
  switch ( input ) {
    case "tom":
      return "tomorrow";
    case "tod":
      return "today";
    case "yest":
    case "y":
      return "yesterday";
    default:
      return input;
  }
}

export function hasProjectTaskDetailCombinationsWithEntries( dataObj: any ): boolean {
  const withoutEmptyObjects = Object.keys( dataObj )
    .filter( project => Object.keys( dataObj[project] )
      .filter( taskDetail => Object.keys( dataObj[project][taskDetail] ).length
      ).length
    );
  return withoutEmptyObjects.length !== 0;
}
