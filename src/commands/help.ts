import { Command, Flags } from "@oclif/core";
import CustomHelp from "../CustomHelp";

export default class HelpCommand extends Command {
  // source: https://github.com/oclif/plugin-help/blob/main/src/commands/help.ts
  static strict = false;

  static description = "Display help for <%= config.bin %>.";
  static flags = {
    "nested-commands": Flags.boolean( {
      description: "Include all nested commands in the output.",
      char       : "n",
    } ),
  };

  async run(): Promise<void> {
    const { flags, argv } = await this.parse( HelpCommand );
    const help = new CustomHelp( this.config, { all: flags["nested-commands"] } );
    await help.showHelp( argv as string[] );
  }
}
