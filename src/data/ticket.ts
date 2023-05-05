import { fs, TICKETS_FILE } from "../config";
import { TicketData } from "./interfaces";
import * as askFor from "../controller/questions";
import { applyColor } from "../controller/utils";

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

  static async expandInNote( { note, project, dontMatchNumbers, dontMatchProject, dontMatchNewTickets } ): Promise<string> {
    const tickets = await this.readByProject( project );

    const ticketsMatched = getTicketMatches( { note, project, tickets, dontMatchNumbers, dontMatchProject } );
    const existingTickets = ticketsMatched.filter( id => tickets[id] );
    const nonExistingTickets = ticketsMatched.filter( id => !tickets[id] );

    note = existingTickets.reduce( ( note, id ) => {
      console.log( `Matched and expanded ticket ${applyColor( "ticket", id )}!` );
      const title = tickets[id];
      return replaceTicketInNote( note, id, title );
    }, note );

    if ( !dontMatchNewTickets ) {
      const newCreatedTickets: string[][] = [];
      for ( const id of nonExistingTickets ) {
        console.log( `Matched a new ticket ${applyColor( "ticket", id )}!` );
        const title = await askFor.text( `Enter its title: (leave empty to not add it)` );
        if ( title ) {
          await Ticket.writeTicket( { project, id, title } );
          newCreatedTickets.push( [ id, title ] );
        }
      }
      note = newCreatedTickets.filter( x => x )
        .reduce( async ( note, [ id, title ]: any ) => replaceTicketInNote( note, id, title ), note );
    }

    return note;
  }
}

function replaceTicketInNote( note: string, id: string, title: string ) {
  const replacementText = `${id} (${title})`;
  if ( note.match( id ) )
    return note.replace( id, replacementText );
  else
    return note.replace( id.split( "-" )[1], replacementText );
}

function matchByProjectCode( note, project ): string[] {
  return Array.from( note.matchAll( `${project}[^ ]+` ) )
    .map( ( [ id ]: any ) => id );
}
function matchByNumbers( note, project ): string[] {
  return Array.from( note.matchAll( `[0-9]{3,6}` ) )
    .map( ( [ numbers ]: any ) => `${project}-${numbers}` );
}
function getTicketMatches( { note, project, tickets, dontMatchNumbers, dontMatchProject } ) {
  let matches: string[] = [];

  if ( !dontMatchProject )
    matches = matchByProjectCode( note, project );

  if ( !dontMatchNumbers ) {
    const idsMatchedByNumbers = matchByNumbers( note, project );
    matches = [ ...new Set( matches.concat( idsMatchedByNumbers ) ) ];
  }

  if ( Object.keys( tickets ).length !== 0 )
    matches = Object.entries( tickets ).reduce( ( matches: string[], [ id ]: any ) => {
      if ( note.match( id ) )
        matches.push( id );
      return matches;
    }, matches );

  return matches;
}
