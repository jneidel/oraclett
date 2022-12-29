import fs from "fs/promises";
import { DATA_DIR } from ".";

export async function createDataDir() {
  await fs.mkdir( DATA_DIR, { recursive: true } );
}

export async function read( FILE: string ) {
  return fs.readFile( FILE, { encoding: "utf8" } )
    .then( jsonString => JSON.parse( jsonString ) )
    .catch( err => {
      if ( err.code === "ENOENT" ) {
        console.log( "ENOENT" );
        return {};
      } else {
        console.log( err );
        return {};
      }
    } );
}

export async function write( FILE: string, data: any ) {
  const jsonString = JSON.stringify( data, null, 2 );
  await createDataDir();
  await fs.writeFile( FILE, jsonString );
}
