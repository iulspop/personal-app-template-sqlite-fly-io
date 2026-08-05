import "../instrument.server.mjs"

import crypto from "node:crypto"
import { PassThrough } from "node:stream"
import { contentSecurity } from "@nichtsam/helmet/content"
import { createReadableStreamFromReadable } from "@react-router/node"
import * as Sentry from "@sentry/react-router"
import { isbot } from "isbot"
import type { RenderToPipeableStreamOptions } from "react-dom/server"
import { renderToPipeableStream } from "react-dom/server"
import type { EntryContext, RouterContextProvider } from "react-router"
import { ServerRouter } from "react-router"

import { getServerEnv } from "./config/server-env.server"
import { NonceProvider } from "./utils/nonce-provider"

export const instrumentations = [Sentry.createSentryServerInstrumentation()]
export const streamTimeout = 5000

const nonceLength = 16
const MODE = getServerEnv().NODE_ENV

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _routerContextProvider: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return Promise.resolve(
      new Response(null, {
        headers: responseHeaders,
        status: responseStatusCode,
      }),
    )
  }

  const nonce = crypto.randomBytes(nonceLength).toString("hex")

  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get("user-agent")

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady"

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <ServerRouter context={routerContext} nonce={nonce} url={request.url} />
      </NonceProvider>,
      {
        nonce,
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId)
              callback()
            },
          })
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set("Content-Type", "text/html")

          contentSecurity(responseHeaders, {
            contentSecurityPolicy: {
              directives: {
                fetch: {
                  "connect-src": [
                    MODE === "development" ? "ws:" : undefined,
                    "'self'",
                    "https://*.posthog.com",
                    "https://*.i.posthog.com",
                    "https://*.ingest.sentry.io",
                    "https://*.ingest.us.sentry.io",
                  ],
                  "font-src": ["'self'"],
                  "frame-src": ["'self'"],
                  "img-src": ["'self'", "data:"],
                  "script-src": [
                    "'strict-dynamic'",
                    "'self'",
                    `'nonce-${nonce}'`,
                  ],
                  "script-src-attr": [`'nonce-${nonce}'`],
                  "style-src": ["'self'", `'nonce-${nonce}'`],
                },
              },
              reportOnly: MODE !== "production",
            },
            crossOriginEmbedderPolicy: false,
          })

          pipe(body)

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            console.error(error)
          }
        },
        onShellError(error: unknown) {
          reject(error)
        },
      },
    )

    timeoutId = setTimeout(() => abort(), streamTimeout + 1000)
  })
}

export default handleRequest

export const handleError = Sentry.createSentryHandleError({ logErrors: true })
