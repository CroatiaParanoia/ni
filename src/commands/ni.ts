import { execaCommand } from 'execa'
import { createAsyncAutocomplete } from '../autocomplete'
import { parseNi } from '../parse'
import { runCli } from '../runner'

interface PackageItem {
  name: string
  scope: string
  version: string
  description: string
  keywords: string[]
  date: string
}

runCli((agent, args, ctx) => {
  parseNi(agent, args, ctx)

  createAsyncAutocomplete('ni', {
    actions: [
      {
        action: 'packageName',
        recommend: async ({ before, line }) => {
          if (before.trim() === line.trim())
            return []

          const res = await execaCommand(`npm search ${before} --json`)

          const packages: PackageItem[] = JSON.parse(res.stdout)

          return packages.map(v => v.name)
        },
      },
    ],
  })

  return undefined
})
