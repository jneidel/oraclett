import { fs, TICKETS_FILE } from "../config";
import { TicketData } from "./interfaces";
import chalk from "chalk";
import * as askFor from "../controller/questions";

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

  static async expandInNote( { note, project, dontMatchNumbers, dontMatchProject, dontMatchTickets } ): Promise<string> {
    const tickets = await this.readByProject( project );

    const existingTicketsMatched = matchAgainstExistingTickets( { note, tickets } );
    note = existingTicketsMatched.reduce( ( note, id ) => {
      console.log( `Matched and expanded ticket ${chalk.grey( id )}!` );
      const title = tickets[id];
      return note.replace( id, `${id} (${title})` );
    }, note );

    if ( !dontMatchTickets && !( dontMatchNumbers && dontMatchProject ) ) {
      const newTicketsMatched = getNewTicketMatches( { note, project, tickets, dontMatchNumbers, dontMatchProject } );

      const newCreatedTickets: string[][] = [];
      for ( const id of newTicketsMatched ) {
        console.log( `Matched a new ticket ${chalk.grey( id )}!` );
        const title = await askFor.text( `Enter its title: (leave empty to not add it)` );
        if ( title ) {
          await Ticket.writeTicket( { project, id, title } );
          newCreatedTickets.push( [ id, title ] );
        }
      }

      note = newCreatedTickets.filter( x => x )
        .reduce( async ( note, [ id, title ]: any ) => note.replace( id, `${id} (${title})` ), note );
    }

    return note;
  }
}

function matchByProjectCode( note, project ): string[] {
  return Array.from( note.matchAll( `${project}[^ ]+` ) )
    .map( ( [ id ]: any ) => id );
}
function matchByNumbers( note, project ): string[] {
  return Array.from( note.matchAll( `[0-9]{4,6}` ) )
    .map( ( [ numbers ]: any ) => `${project}-${numbers}` )
    .filter( id => note.match( id ) ); // check that id actually exists
}
function getNewTicketMatches( { note, project, tickets, dontMatchNumbers, dontMatchProject } ) {
  let matches: string[] = [];
  if ( !dontMatchProject )
    matches = matchByProjectCode( note, project );

  if ( !dontMatchNumbers ) {
    const idsMatchedByNumbers = matchByNumbers( note, project );
    matches = [ ...new Set( matches.concat( idsMatchedByNumbers ) ) ];
  }

  return matches.filter( id => !tickets[id] );
}
function matchAgainstExistingTickets( { note, tickets } ): string[] {
  if ( Object.keys( tickets ).length !== 0 )
    return Object.entries( tickets ).reduce( ( matches: string[], [ id ]: any ) => {
      if ( note.match( id ) )
        matches.push( id );
      return matches;
    }, [] );
  else
    return [];
}
