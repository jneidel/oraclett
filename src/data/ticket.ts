import { fs, TICKETS_FILE } from "../config";
import { TicketData } from "./interfaces";

export default class Ticket {
  private static FILE = TICKETS_FILE;
  static readAll = fs.readAll( this.FILE );
  static writeAll = fs.writeAll( this.FILE );

  static readByProject( project: string ) {
    return Ticket.readAll()
      .then( tickets => tickets?.[project] );
  }

  static async writeTicket( data: TicketData ) {
    const { project, id, title } = data;
    const tickets = await this.readAll();

    const dataToBeWritten = {
      [project]: {
        [id]: title,
      },
    };

    let ticketsWithNewData = tickets;
    if ( !tickets[project] )
      ticketsWithNewData = Object.assign( tickets, dataToBeWritten );
    else
      ticketsWithNewData[project] = Object.assign( tickets[project], dataToBeWritten[project] );

    return this.writeAll( ticketsWithNewData );
  }

  static async deleteByProject( projectKey: string ) {
    const tickets = await this.readAll();

    delete tickets[projectKey];

    return this.writeAll( tickets );
  }
  static async deleteById( projectKey: string, id: string ) {
    const tickets = await this.readAll();

    delete tickets?.[projectKey]?.[id];

    return this.writeAll( tickets );
  }
}
