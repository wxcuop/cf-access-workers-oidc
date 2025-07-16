import { createRouter } from './routes'
import { Env, ScheduledController, ExecutionContext } from './types'
import { getDoStub } from './utils'

export { OpenIDConnectDurableObject } from './oidc-do'

const router = createRouter()

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await router.handle(request, env)
    } catch (e) {
      return new Response((e as Error).message)
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const stub = getDoStub(env)

    ctx.waitUntil(
      stub.fetch('https://fake-host/jwks', {
        method: 'PATCH',
      }),
    )
  },
}
