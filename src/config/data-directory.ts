import { join } from "path";

const { HOME } = process.env;
if ( !HOME ) {
  console.error( "Environmental variable $HOME is not set" );
  process.exit( 1 );
}

export const DATA_DIR = join( HOME, ".local/share/oraclett" );
export const PROJECTS_FILE = join( DATA_DIR, "projects.json" );
export const HOURS_FILE = join( DATA_DIR, "hours.json" );
export const TASKS_FILE = join( DATA_DIR, "tasks.json" );
