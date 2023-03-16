import { Command } from "@oclif/core";
import { removeProject } from "../../controller/project";
import * as askFor from "../../controller/questions";

export default class Remove extends Command {
  static summary = "Remove a project or a projects task details interactively.";
  static aliases = [ "project:delete", "project:r", "project:d" ];

  async run(): Promise<void> {
    const whatToRemove = await askFor.projectOrTaskDetail( "What do you want to remove?" );

    const projectKey = await askFor.project();

    if ( whatToRemove === "project" ) {
      removeProject( projectKey );
    } else {
      const taskDetailKey = await askFor.taskDetail( projectKey );
      removeProject( projectKey, taskDetailKey );
    }
  }
}
