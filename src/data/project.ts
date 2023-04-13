import { fs, PROJECTS_FILE } from "../config";
import Hour from "./hour";
import Note from "./note";
import Ticket from "./ticket";
import { findInstancesOfProjectInData, findInstancesOfTaskDetailInData } from "./utils";

export default class Project {
  private static FILE = PROJECTS_FILE;
  static readAll = fs.readAll( this.FILE );
  static writeAll = fs.writeAll( this.FILE );

  static async deleteProject( projectKey: string ) {
    return Promise.all( [
      ( async () => {
        const projects = await this.readAll();

        delete projects?.[projectKey];

        return this.writeAll( projects );
      } )(),
      Note.deleteByProject( projectKey ),
      Hour.deleteByProject( projectKey ),
      Ticket.deleteByProject( projectKey ),
    ] );
  }
  static async deleteTaskDetail( projectKey: string, taskDetailKey: string ) {
    return Promise.all( [
      ( async () => {
        const projects = await this.readAll();

        delete projects?.[projectKey]?.taskDetails?.[taskDetailKey];

        return this.writeAll( projects );
      } )(),
      Note.deleteByTaskDetail( projectKey, taskDetailKey ),
      Hour.deleteByTaskDetail( projectKey, taskDetailKey ),
    ] );
  }
}

export async function editTaskDetailData( projectKey: string, taskDetailKey: string, newTaskDetailObject: any ) {
  const projects = await Project.readAll();
  projects[projectKey].taskDetails = Object.assign( projects[projectKey].taskDetails, newTaskDetailObject );

  const [ newTaskDetailKey ] = Object.keys( newTaskDetailObject );
  const keyHasChanged = taskDetailKey !== newTaskDetailKey;

  if ( keyHasChanged ) {
    delete projects[projectKey].taskDetails[taskDetailKey];

    const [ hours, notes ] = await Promise.all( [ Hour.readAll( true ), Note.readAll( true ) ] );

    const rewriteInstance = data => instance => {
      const { year, week } = instance;
      data[year][week][projectKey][newTaskDetailKey] = data[year][week][projectKey][taskDetailKey];
      delete data[year][week][projectKey][taskDetailKey];
    };
    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, hours ).forEach( rewriteInstance( hours ) );
    findInstancesOfTaskDetailInData( projectKey, taskDetailKey, notes ).forEach( rewriteInstance( notes ) );
    Hour.writeAll( hours );
    Note.writeAll( notes );
  }

  await Project.writeAll( projects );
}
export async function editProjectData( projectKey: string, newProjectObject: any ) {
  let projects = await Project.readAll();
  const [ newProjectKey ] = Object.keys( newProjectObject );
  newProjectObject[newProjectKey].taskDetails = projects[projectKey].taskDetails;
  projects = Object.assign( projects, newProjectObject );

  const keyHasChanged = projectKey !== newProjectKey;

  if ( keyHasChanged ) {
    delete projects[projectKey];

    const [ hours, notes, tickets ] = await Promise.all( [ Hour.readAll( true ), Note.readAll( true ), Ticket.readAll( true ) ] );

    const rewriteInstance = data => instance => {
      const { year, week } = instance;
      data[year][week][newProjectKey] = data[year][week][projectKey];
      delete data[year][week][projectKey];
    };
    findInstancesOfProjectInData( projectKey, hours ).forEach( rewriteInstance( hours ) );
    findInstancesOfProjectInData( projectKey, notes ).forEach( rewriteInstance( notes ) );
    Hour.writeAll( hours );
    Note.writeAll( notes );

    tickets[newProjectKey] = tickets[projectKey];
    delete tickets[projectKey];
    Ticket.writeAll( tickets );
  }

  await Project.writeAll( projects );
  return newProjectKey;
}
