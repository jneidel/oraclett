import Ticket from "../data/ticket";
import { hasExistingValue, getFullNames, applyColor } from "./utils";
import { validateProject } from "./validation";
import * as askFor from "./questions";

export const addTicket = Ticket.writeTicket.bind( Ticket );

function sortById( [ aId ]: any, [ bId ]: any ) {
  return aId > bId ? 1 : -1;
}
function printIdAndTitle( [ ticketId, title ] ) {
  console.log( `  ${applyColor( "ticket", ticketId )}: ${title}` );
}
async function printTicketsForProject( project: string, data: Object ) {
  const projectIdAndTitle = await getFullNames.project( project, { style: "parens", colorForWhat: "project" } );
  console.log( projectIdAndTitle );

  Object.entries( data ).filter( hasExistingValue )
    .sort( sortById )
    .forEach( printIdAndTitle );
}
export async function listTickets() {
  const tickets = await Ticket.readAll();

  if ( Object.keys( tickets ).length === 0 )
    return console.error( `There are no tickets yet.\n
To add some use: ticket add` );

  Object.entries( tickets ).filter( hasExistingValue )
    .forEach( ( [ projectKey, data ]: any ) => {
      printTicketsForProject( projectKey, data );
    } );
}
export async function listTicketsByProject( project: string ) {
  const projectTickets = await Ticket.readByProject( project );

  if ( Object.keys( projectTickets ).length === 0 )
    return console.error( `There are no tickets for this project.\n
To add some use: ticket add` );

  printTicketsForProject( project, projectTickets );
}

export async function editTicket( flags: { project?: string; id?: string; title?: string; newId?: string } ) {
  let { project, id, title, newId }: any = flags;
  const isInteractive = !( project && id && title ) && !( project && id && newId );

  let isOperatingOn: "id"|"title";
  if ( isInteractive )
    isOperatingOn = await askFor.eitherIdOrTitle( "What do you want to edit?" );
  else
    isOperatingOn = newId ? "id" : "title";

  const tickets = await Ticket.readAll();

  if ( project )
    await validateProject( project );
  else
    project = await askFor.project( Object.keys( tickets ) );

  const projectTickets = tickets?.[project];
  if ( Object.keys( projectTickets ).length === 0 )
    return console.error( `There are no tickets for this project (${project}).\n
To add some use: ticket add` );

  if ( !id ) {
    const idChoices = Object.entries( projectTickets ).sort( sortById )
      .map( ( [ id, title ]: any ) => ( {
        name : `${applyColor( "ticket", id )}: ${title}`,
        value: id,
      } ) );
    id = await askFor.selection( `Pick ticket to edit the ${isOperatingOn} for:`, idChoices );
  }
  if ( !projectTickets[id] )
    return console.error( `There are no tickets within ${project} for this id (${id}).\n
To add some use:       ticket add
To list existing ones: ticket list` );

  if ( isOperatingOn === "title" && !title )
    title = await askFor.renaming( projectTickets[id] );

  if ( isOperatingOn === "id" ) {
    title = projectTickets[id];

    if ( !newId )
      newId = await askFor.renaming( id );

    Ticket.deleteById( project, id );
    id = newId;
  }

  return Ticket.writeTicket( { project, id, title } )
    .then( () => console.log( `Successfully edited the ${isOperatingOn}!` ) )
    .then( () => listTicketsByProject( project ) );
}

export async function removeTicket( flags: { project?: string; id?: string } ) {
  let { project, id }: any = flags;
  const tickets = await Ticket.readAll();

  if ( project )
    await validateProject( project );
  else
    project = await askFor.project( Object.keys( tickets ) );

  const projectTickets = tickets?.[project];
  if ( Object.keys( projectTickets ).length === 0 )
    return console.error( `There are no tickets for this project (${project}).\n
To add some use: ticket add` );

  if ( !id ) {
    const idChoices = Object.entries( projectTickets ).sort( sortById )
      .map( ( [ id, title ]: any ) => ( {
        name : `${applyColor( "ticket", id )}: ${title}`,
        value: id,
      } ) );
    id = await askFor.selection( `Pick ticket to delete:`, idChoices );
  }
  if ( !projectTickets[id] )
    return console.error( `There are no tickets within ${project} for this id (${id}).\n
To add some use:       ticket add
To list existing ones: ticket list` );

  return Ticket.deleteById( project, id )
    .then( () => console.log( "Successfully remove the ticket!" ) );
}
