import {Command, Flags} from '@oclif/core'
import { projects } from "../../config";

export default class Add extends Command {
  static description = 'Add a project'

  static examples = [
    `
$ oraclett project add
$ oraclett project add "INTPD999DXD - People Development DXD"
$ oraclett project add "INTPD999DXD - People Development DXD" -t "01 - Career development" -t "03 - Discipline Weeks"
`,
  ]

  static flags = {
    taskDetail: Flags.string({
      char: 't',
      description: 'A task detail',
      multiple: true,
      aliases: ["task", "detail", "details"],
    }),
  }

  static args = [{
    name: 'project_code',
    description: 'The project code',
  }]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)

    projects.add( args.project_code, flags.taskDetail )
  }
}
