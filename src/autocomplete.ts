import type { CallbackAsyncValue, CallbackValue } from 'omelette'
import omelette from 'omelette'

type AsyncGetter<T, P = any> = (payload: P) => Promise<T>

type ValueGetter<T, P = any> = (p: P) => T

type ValueOrAsyncGetter<T, P = any> = T | AsyncGetter<T, P>

type ValueOrValueGetter<T, P> = T | ValueGetter<T, P>

function isGetter<T, P = any>(input: ValueOrAsyncGetter<T, P>): input is AsyncGetter<T, P>
function isGetter<T, P = any>(input: ValueOrValueGetter<T, P>): input is ValueGetter<T, P>
function isGetter <T, P = any>(input: ValueOrAsyncGetter<T>): input is AsyncGetter<T, P> {
  return typeof input === 'function'
}

const getValueFromValueOrAsyncGetter = async <T, P>(input: ValueOrAsyncGetter<T, P>, payload: P): Promise<T> => {
  if (isGetter(input))
    return await input(payload)

  return input
}

const getValueFromValueOrValueGetter = <T, P>(input: ValueOrValueGetter<T, P>, payload: P): T => {
  if (isGetter(input))
    return input(payload)

  return input
}

interface AutocompleteOptions {
  actions: [
    {
      action: string
      recommend: ValueOrValueGetter<string[], Omit<CallbackValue, 'reply'>>
    },
  ]
}

interface AsyncAutomcompleteOptions {
  actions: [
    {
      action: string
      recommend: ValueOrAsyncGetter<string[], Omit<CallbackAsyncValue, 'reply'>>
    },
  ]
}

type Autocomplete<T extends AutocompleteOptions | AsyncAutomcompleteOptions> = (cmd: string, options: T) => void

const createSyncAutocomplete: Autocomplete<AutocompleteOptions> = (cmd, options) => {
  const { actions } = options
  const template = actions.map(v => `<${v.action}>`).join(' ')

  const complete = omelette(`${cmd} ${template}`)
  actions.forEach(({ action, recommend }) => {
    complete.on(action, ({ reply, ...otherInfo }) => {
      const recommendList = getValueFromValueOrValueGetter(recommend, otherInfo)

      reply(recommendList)
    })
  })

  complete.init()
}

const createAsyncAutocomplete: Autocomplete<AsyncAutomcompleteOptions> = (cmd, options) => {
  const { actions } = options
  const template = actions.map(v => `<${v.action}>`).join(' ')

  const complete = omelette(`${cmd} ${template}`)

  actions.forEach(({ action, recommend }) => {
    complete.onAsync(action, async ({ reply, ...otherInfo }) => {
      const recommendList = await getValueFromValueOrAsyncGetter(recommend, otherInfo)

      return reply(Promise.resolve(recommendList))
    })
  })

  complete.init()
}

export {
  createAsyncAutocomplete,
  createSyncAutocomplete,
}
