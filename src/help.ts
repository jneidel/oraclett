import { Help } from "@oclif/core";
import chalk from "chalk";

export default class CustomHelp extends Help {
  public async showRootHelp() {
    // Source: https://github.com/oclif/core/blob/main/src/help/index.ts
    const formattedRoot = this.formatRoot().split( "\n" );
    formattedRoot[2] = chalk.bold( "REPOSITORY" );
    formattedRoot[3] = "  https://github.com/jneidel/oraclett";
    this.log( formattedRoot.join( "\n" ), "\n" );

    if ( this.sortedTopics.length !== 0 ) {
      const formattedTopics = this.formatTopics( this.sortedTopics ).split( "\n" );
      formattedTopics[0] = chalk.bold( "COMMANDS" );
      this.log( formattedTopics.join( "\n" ), "\n" );
    }
  }
}
