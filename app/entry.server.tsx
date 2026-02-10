import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { contentSecurity } from "@nichtsam/helmet/content";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";

import { getInstance } from "./features/localization/i18next-middleware.server";
import { NonceProvider } from "./utils/nonce-provider";

export const streamTimeout = 5000;

const nonceLength = 16;
const MODE = process.env.NODE_ENV ?? "development";

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  routerContextProvider: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return Promise.resolve(
      new Response(null, {
        headers: responseHeaders,
        status: responseStatusCode,
      }),
    );
  }

  const nonce = crypto.randomBytes(nonceLength).toString("hex");

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <I18nextProvider i18n={getInstance(routerContextProvider)}>
          <ServerRouter
            context={routerContext}
            nonce={nonce}
            url={request.url}
          />
        </I18nextProvider>
      </NonceProvider>,
      {
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          contentSecurity(responseHeaders, {
            contentSecurityPolicy: {
              directives: {
                fetch: {
                  "connect-src": [
                    MODE === "development" ? "ws:" : undefined,
                    "'self'",
                    "*.ingest.sentry.io",
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
                  "style-src": ["'self'"],
                },
              },
              reportOnly: MODE !== "production",
            },
            crossOriginEmbedderPolicy: false,
          });

          pipe(Sentry.getMetaTagTransformer(body));

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
        onShellError(error: unknown) {
          reject(error);
        },
      },
    );
  });
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

export const handleError = Sentry.createSentryHandleError({ logErrors: true });
