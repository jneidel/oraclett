export let DATA_DIR: string;
if ( process.argv[1].match( /bin\/run$/ ) )
  // dev
  DATA_DIR = `${process.env.HOME}/.local/share/oraclett-dev`;
else
  // prod
  DATA_DIR = `${process.env.HOME}/.local/share/oraclett`;

export const PROJECTS_FILE = `${DATA_DIR}/projects.json`;
export const HOURS_FILE = `${DATA_DIR}/hours.json`;
export const NOTES_FILE = `${DATA_DIR}/notes.json`;
export const TICKETS_FILE = `${DATA_DIR}/tickets.json`;
