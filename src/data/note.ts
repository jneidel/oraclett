import { fs, NOTES_FILE } from "../config";
import { findInstancesOfProjectInData, findInstancesOfTaskDetailInData } from "./utils";

export default class Note {
  private static FILE = NOTES_FILE;
  static readAll = fs.readAll( this.FILE );
  static writeAll = fs.writeAll( this.FILE );

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
