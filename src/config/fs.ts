import fs from "fs/promises";
import { DATA_DIR, PROJECTS_FILE } from ".";
import defaultProjects from "./default-projects.json";

const cachedFileContents = {};

export async function createDataDir() {
  await fs.mkdir( DATA_DIR, { recursive: true } );
}

function getDefaultValueForEmptyFile( FILE: string ) {
  switch ( FILE ) {
    case PROJECTS_FILE:
      return defaultProjects;
    default:
      return {};
  }
}
async function read( FILE: string, forceReadingFromDisk = false ) {
  if ( !forceReadingFromDisk && cachedFileContents[FILE] )
    return new Promise( resolve => resolve( cachedFileContents[FILE] ) );

  return fs.readFile( FILE, { encoding: "utf8" } )
    .then( jsonString => JSON.parse( jsonString ) )
    .catch( err => {
      if ( err.code === "ENOENT" )
        return getDefaultValueForEmptyFile( FILE );
      else
        return getDefaultValueForEmptyFile( FILE );

    } )
    .then( data => {
      cachedFileContents[FILE] = data;
      return data;
    } );
}
export function readAll( FILE: string ): Function {
  return async ( forceReadingFromDisk = false ) => read( FILE, forceReadingFromDisk );
}

async function write( FILE: string, data: any ) {
  cachedFileContents[FILE] = data;
  const jsonString = JSON.stringify( data, null, 2 );
  await createDataDir();
  await fs.writeFile( FILE, jsonString );
}
export function writeAll( FILE: string ): Function {
  return async ( data: Object ) => write( FILE, data );
}
