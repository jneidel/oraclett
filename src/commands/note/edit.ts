import { Command } from "@oclif/core";
import { editNote } from "../../controller/notes";
import { dayWeekMode } from "../../controller/hours";
import { parseDateStringForValues } from "../../controller/utils";
import * as askFor from "../../controller/questions";

export default class Edit extends Command {
  static summary = "Edit the your notes interactively.";
  static description = dayWeekMode.helpText;
  static examples = dayWeekMode.examples;

  static flags = {
    date: dayWeekMode.dateFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Edit );
    const dateString = flags.date;

    const [ week, year, dayInQuestion ] = parseDateStringForValues( dateString, "%V %G %a" );
    const operatingMode = dayWeekMode.evalOperatingMode( dateString );
    const throwNoTimeLoggedError = dayWeekMode.getNoTimeLoggedErrorFunction( dateString, this.error );

  }
}
