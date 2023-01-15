import { Command, Flags } from "@oclif/core";
import clipboard from "clipboardy";
import { generateReports } from "../../controller/timecard";
import * as askFor from "../../controller/questions";
import { parseDateStringForValues } from "../../controller/utils";

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
  };

  static examples = [ `$ <%= config.bin %> <%= command.id %>
$ <%= config.bin %> <%= command.id %> -d "last week" -I
` ];

  async run(): Promise<void> {
    const { flags } = await this.parse( List );
    const { date, "no-interactive": noInteractive } = flags;

    const [ isoWeek, isoYear ] = parseDateStringForValues( date, "%V %G" );
    this.log( `Timecard for week ${isoWeek} of ${isoYear}:\n` );

    const [ reports, noteStringsForClipboard ] = await generateReports( date, noInteractive );

    const reportSeperator = "----------------------------------";
    const printReport = async () => {
      this.log( reports.shift() );
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
      this.log( reports.join( `\n${reportSeperator}\n` ) );
    else
      await printReport();
  }
}
