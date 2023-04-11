import { fs, NOTES_FILE } from "../config";
import { findInstancesOfProjectInData, findInstancesOfTaskDetailInData } from "./utils";

export default class Note {
  static async readAll( forceReadingFromDisk = false ) {
    return fs.read( NOTES_FILE, forceReadingFromDisk );
  }
  static async writeAll( data: Object ) {
    return fs.write( NOTES_FILE, data );
  }

  static async deleteByProject( projectKey: string ) {
    const notes = await this.readAll();

    findInstancesOfProjectInData( projectKey, notes )
      .forEach( ( { year, week } ) => {
        delete notes?.[year]?.[week]?.[projectKey];
      } );

    return this.writeAll( notes );
  }
  static async deleteByTaskDetail( projectKey: string, taskDetailKey: string ) {
    const notes = await this.readAll();

    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, notes )
      .forEach( ( { year, week } ) => {
        delete notes?.[year]?.[week]?.[projectKey]?.[taskDetailKey];
      } );

    return this.writeAll( notes );
  }
}
