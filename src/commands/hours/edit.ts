import { Command } from "@oclif/core";
import { readHours, editHours } from "../../controller/hours";
import { parseDateStringForValues } from "../../controller/utils";
import * as askFor from "../../controller/questions";
import * as dayWeekMode from "../../controller/day-week-mode";

export default class Edit extends Command {
  static summary = "Edit the logged hours interactively.";
  static description = dayWeekMode.helpText;
  static examples = dayWeekMode.examples;

  static flags = {
    date: dayWeekMode.dateFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse( Edit );
    const dateString = flags.date;

    const [ week, year, dayInQuestion ] = parseDateStringForValues( dateString, "%V %G %a" );
    let operatingMode = dayWeekMode.evalOperatingMode( dateString );
    let throwNoTimeLoggedError = dayWeekMode.getNoEntriesErrorFunction( dateString, this.error, "hours" );

    const hours = await readHours();
    if ( !( hours[year] && hours[year][week] ) )
      throwNoTimeLoggedError();
    const hoursData = hours[year][week];

    if ( dateString === "today" && !dayWeekMode.dayModeHasResults( hoursData, dayInQuestion ) ) {
      this.log( "No entries for today. Changing to week mode." );
      operatingMode = "week";
      throwNoTimeLoggedError = dayWeekMode.getNoEntriesErrorFunction( "this week", this.error, "hours" );
    }

    if ( operatingMode === "day" ) {
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runDayMode( dayInQuestion, hoursData, throwNoTimeLoggedError );
    } else {
      // @ts-ignore
      var { project, taskDetail, dayOfTheWeek } = await dayWeekMode.runWeekMode( hoursData, throwNoTimeLoggedError );
    }

    const currentHours = hoursData[project][taskDetail][dayOfTheWeek];
    const newHours = await askFor.number( `To how many hours should this be changed? (Current: ${currentHours})`, currentHours );

    editHours( { newHours, project, taskDetail, year, week, dayOfTheWeek } );
  }
}
