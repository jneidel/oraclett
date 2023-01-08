import { Command } from "@oclif/core";
import { editProject } from "../../controller/project";
import { getFullNames } from "../../controller/utils";
import * as askFor from "../../controller/questions";

export default class Edit extends Command {
  static summary = "Edit the names interactively.";
  static description = `Allows for renaming a projects or their task details.
\n${askFor.renamingHelpText( "rename" )}`;

  async run(): Promise<void> {
    const whatToEdit = await askFor.projectOrTaskDetail( "What do you want to edit?" );

    const projectKey = await askFor.project();

    let valueToEdit: string;
    if ( whatToEdit === "project" ) {
      valueToEdit = await getFullNames.project( projectKey );
    } else {
      var taskDetailKey = await askFor.taskDetail( projectKey );
      valueToEdit = await getFullNames.taskDetail( projectKey, taskDetailKey );
    }

    const renamedValue = await askFor.renaming( valueToEdit );

    if ( whatToEdit === "project" )
      editProject( { project: projectKey, newName: renamedValue } );
    else
      editProject( { project: projectKey, newName: renamedValue, taskDetail: taskDetailKey } );
  }
}
