import fs from "fs/promises";
import { DATA_DIR } from ".";

const fileContents = {};

export async function createDataDir() {
  await fs.mkdir( DATA_DIR, { recursive: true } );
}

export async function read( FILE: string, forceReadingFromDisk = false ) {
  if ( !forceReadingFromDisk && fileContents[FILE] )
    return new Promise( resolve => resolve( fileContents[FILE] ) );

  return fs.readFile( FILE, { encoding: "utf8" } )
    .then( jsonString => JSON.parse( jsonString ) )
    .catch( err => {
      if ( err.code === "ENOENT" ) {
        return {};
      } else {
        console.log( err );
        return {};
      }
    } )
    .then( data => {
      fileContents[FILE] = data;
      return data;
    } );
}

export async function write( FILE: string, data: any ) {
  const jsonString = JSON.stringify( data, null, 2 );
  await createDataDir();
  await fs.writeFile( FILE, jsonString );
}
