import { fs, HOURS_FILE } from "../config";
import { findInstancesOfProjectInData, findInstancesOfTaskDetailInData } from "./utils";

export default class Hour {
  private static FILE = HOURS_FILE;
  static readAll = fs.readAll( this.FILE );
  static writeAll = fs.writeAll( this.FILE );

  static async readByYearAndWeek( year: string, week: string ): Promise<any> {
    return this.readAll().then( hours => {
      return hours?.[year]?.[week] || {};
    } );
  }

  static async deleteByProject( projectKey: string ) {
    const hours = await this.readAll();

    findInstancesOfProjectInData( projectKey, hours )
      .forEach( ( { year, week } ) => {
        delete hours?.[year]?.[week]?.[projectKey];
      } );

    return this.writeAll( hours );
  }

  static async deleteByTaskDetail( projectKey: string, taskDetailKey: string ) {
    const hours = await this.readAll();

    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, hours )
      .forEach( ( { year, week } ) => {
        delete hours?.[year]?.[week]?.[projectKey]?.[taskDetailKey];
      } );

    return this.writeAll( hours );
  }
}
