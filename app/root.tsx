import * as Sentry from "@sentry/react-router"
import { OpenImgContextProvider } from "openimg/react"
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router"

import type { Route } from "./+types/root"
import { darkThemeClass, lightThemeClass } from "./design-system/theme.css"
import "./design-system/global.css"

import { ProgressBarComponent } from "./components/progress-bar"
import { authMiddleware } from "./features/auth/application/auth-middleware.server"
import { getUserId } from "./features/auth/application/auth-session.server"
import { ChatNotificationProvider } from "./features/chat/application/chat-notification-provider"
import * as s from "./root.css"
import { ClientHintCheck, getHints } from "./utils/client-hints"
import { getDomainUrl } from "./utils/get-domain-url.server"
import { getImgSrc } from "./utils/get-img-src"
import { useNonce } from "./utils/nonce-provider"
import { securityMiddleware } from "./utils/security-middleware.server"

export const middleware = [securityMiddleware, authMiddleware]

export async function loader({ request }: Route.LoaderArgs) {
  return data({
    allowIndexing: process.env.ALLOW_INDEXING !== "false",
    ENV: {
      MODE: process.env.NODE_ENV,
      POSTHOG_API_HOST: process.env.POSTHOG_API_HOST,
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_ENVIRONMENT:
        process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      SENTRY_RELEASE: process.env.SENTRY_RELEASE,
      SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    },
    isAuthenticated: Boolean(await getUserId(request)),
    requestInfo: {
      hints: getHints(request),
      origin: getDomainUrl(request),
      path: new URL(request.url).pathname,
    },
  })
}

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<typeof loader>("root")
  const nonce = useNonce()
  const themeScript = `(function(){try{var p=localStorage.getItem("app-theme")||"light";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.remove(${JSON.stringify(lightThemeClass)},${JSON.stringify(darkThemeClass)});document.documentElement.classList.add(d?${JSON.stringify(darkThemeClass)}:${JSON.stringify(lightThemeClass)});}catch(e){}})();`

  return (
    <html
      className={lightThemeClass}
      dir="ltr"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Applies the saved local theme before first paint.
          dangerouslySetInnerHTML={{ __html: themeScript }}
          nonce={nonce}
        />
        <ClientHintCheck nonce={nonce} />
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>Personal App</title>
        {!rootData?.allowIndexing && (
          <meta content="noindex, nofollow" name="robots" />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        <ProgressBarComponent />
        <OpenImgContextProvider
          getSrc={getImgSrc}
          optimizerEndpoint="/api/images"
        >
          {rootData?.isAuthenticated ? (
            <ChatNotificationProvider>{children}</ChatNotificationProvider>
          ) : (
            children
          )}
        </OpenImgContextProvider>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Standard pattern for exposing ENV to client in React Router
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(rootData?.ENV ?? {})}`,
          }}
          nonce={nonce}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (error && error instanceof Error) {
    Sentry.captureException(error)

    if (import.meta.env.DEV) {
      details = error.message
      stack = error.stack
    }
  }

  return (
    <main className={s.errorPage}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className={s.stackTrace}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
