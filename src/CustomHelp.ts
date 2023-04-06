import { Help, Interfaces } from "@oclif/core";
import chalk from "chalk";

export default class CustomHelp extends Help {
  constructor( config, opts = {} ) {
    super( config, opts );
  }
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

  formatCommands( c ) {
    return super.formatCommands( c );
  }

  public async showTopicHelp( topic: Interfaces.Topic ) {
    // Source: https://github.com/oclif/core/blob/main/src/help/index.ts
    const { name } = topic;
    const depth = name.split( ":" ).length;
    this.log( this.formatTopic( topic ) );

    const subTopics = this.sortedTopics.filter( t => t.name.startsWith( `${name  }:` ) && t.name.split( ":" ).length === depth + 1 );
    if ( subTopics.length !== 0 ) {
      this.log( this.formatTopics( subTopics ) );
      this.log( "" );
    }

    const commands = this.sortedCommands.filter( c => c.id.startsWith( `${name  }:` ) && c.id.split( ":" ).length === depth + 1 );
    if ( commands.length !== 0 ) {
      const formattedCommands = this.formatCommands( commands ).split( "\n" )
        .filter( line => {
          return !line.match( /^\s+hour log/ ) &&
                 !line.match( /^\s+note delete/ ) &&
                 !line.match( /^\s+hour delete/ ) &&
                 !line.match( /^\s+project delete/ ) &&
                 !line.match( /^\s+project [a-z]\s/ ) &&
                 !line.match( /^\s+note [a-z]\s/ ) &&
                 !line.match( /^\s+hour [a-z]\s/ );
        } ).join( "\n" );
      this.log( formattedCommands );
      this.log( "" );
    }
  }

  public async showCommandHelp( command: Interfaces.Command ) {
    // Source: https://github.com/oclif/core/blob/main/src/help/index.ts
    const name = command.id;
    const depth = name.split( ":" ).length;

    const summary = this.summary( command );
    if ( summary )
      this.log( `${summary  }\n` );

    if ( this.formatCommand( command ).match( /ALIASES/ ) ) {
      const formattedCommand = this.formatCommand( command ).split( "\n" );
      let aliasesStart: any;
      let aliasesEnd: any;
      formattedCommand.forEach( ( line, i ) => {
        if ( line.match( /ALIASES/ ) )
          aliasesStart = i;
        else if ( aliasesStart && !aliasesEnd && !line )
          aliasesEnd = i;
      } );
      this.log( [ ...formattedCommand.slice( 0, aliasesStart ), ...formattedCommand.slice( aliasesEnd + 1 ) ].join( "\n" ) );
    } else {
      this.log( this.formatCommand( command ) );
    }
    this.log( "" );

    const subTopics = this.sortedTopics.filter( t => t.name.startsWith( `${name  }:` ) && t.name.split( ":" ).length === depth + 1 );
    if ( subTopics.length !== 0 ) {
      this.log( this.formatTopics( subTopics ) );
      this.log( "" );
    }

    const subCommands = this.sortedCommands.filter( c => c.id.startsWith( `${name  }:` ) && c.id.split( ":" ).length === depth + 1 );
    if ( subCommands.length !== 0 ) {
      const aliases: string[] = [];
      const uniqueSubCommands: any[] = subCommands.filter( p => {
        aliases.push( ...p.aliases );
        return !aliases.includes( p.id );
      } );
      this.log( this.formatCommands( uniqueSubCommands ) );
      this.log( "" );
    }
  }
}
