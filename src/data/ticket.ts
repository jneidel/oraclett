import { fs, TICKETS_FILE } from "../config";
import { findInstancesOfProjectInData } from "./utils";

export default class Ticket {
  private static FILE = TICKETS_FILE;
  static readAll = fs.readAll( this.FILE );
  static writeAll = fs.writeAll( this.FILE );

  static async writeTicket( projectKey: string, ticketId: string, title: string ) {
    const tickets = await this.readAll();

    const data = {
      [projectKey]: {
        [ticketId]: title,
      },
    };
    const ticketsWithNewData = Object.assign( tickets, data );
    return this.writeAll( ticketsWithNewData );
  }

  static async deleteByProject( projectKey: string ) {
    const tickets = await this.readAll();

    findInstancesOfProjectInData( projectKey, tickets )
      .forEach( () => {
        delete tickets?.[projectKey];
      } );

    return this.writeAll( tickets );
  }
}
