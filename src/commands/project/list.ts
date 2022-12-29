import { Command, Flags } from '@oclif/core'
import { projects } from "../../config";

export default class List extends Command {
  static description = 'List all projects'

  static flags = {
    filter: Flags.string({
      char: 'f',
      description: 'Filter for a project code',
      aliases: ["code"],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(List)

    projects.list(flags.filter);
  }
}
