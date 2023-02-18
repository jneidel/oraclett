import { Command, Flags } from "@oclif/core";
import clipboard from "clipboardy";
import { generateReports } from "../../controller/timecard";
import * as askFor from "../../controller/questions";
import { createHumanReadableWeekIdentifier } from "../../controller/utils";
import { validateDateString } from "../../controller/validation";

export default class List extends Command {
  static summary = "Generate a report for filling out timecards.";
  static description = `It will interactively step through one project after the other,
going along with you while you copy over data into Oracle.`;
  static aliases = [ "timecard" ];

  static flags = {
    date: Flags.string( {
      char       : "d",
      description: "A date to specify the week (can be human-readable)",
      default    : "this week",
    } ),
    "no-interactive": Flags.boolean( {
      char       : "I",
      description: "Just print out the report",
      default    : false,
      aliases    : [ "noInteractive", "i" ],
    } ),
    classic: Flags.boolean( {
      char       : "c",
      description: "Use the classic timecard format",
    } ),
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week" -I
` ];

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date, "no-interactive": noInteractive, classic } = flags;

    validateDateString( date );
    this.log( `Timecard for ${createHumanReadableWeekIdentifier( date, { noLeadingProposition: true } )}:\n` );

    const [ reports, noteStringsForClipboard ] = await generateReports( date, noInteractive, classic, this.error );

    const reportSeperator = "----------------------------------";
    const printReport = async () => {
      const report = reports.shift();
      report();
      await clipboard.write( noteStringsForClipboard.shift() );
      if ( reports.length !== 0 ) {
        const confirm = await askFor.confirmation( {
          message: "Ready to for the next entry?",
          default: true,
        } );
        if ( confirm ) {
          this.log( reportSeperator );
          return printReport();
        }
      }
    };

    if ( noInteractive )
      for ( let i = 0; i < reports.length; i++ ) {
        reports[i]();
        if ( i !== reports.length - 1 )
          this.log( `${reportSeperator}` );
      }
    else
      await printReport();
  }
}
