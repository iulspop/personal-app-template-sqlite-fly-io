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
import { appConfig } from "./config/app-config"
import { getServerEnv } from "./config/server-env.server"
import { darkThemeClass, lightThemeClass } from "./design-system/theme.css"
import "./design-system/global.css"

import { ProgressBarComponent } from "./components/progress-bar"
import { AuthenticatedFeatureProvidersComponent } from "./composition/generated/authenticated-providers"
import { loadRootFeatureData } from "./composition/generated/root-loader-extensions"
import { createClientFeatureEnv } from "./composition/generated/server-env-extensions"
import { authMiddleware } from "./features/auth/application/auth-middleware.server"
import { getUserId } from "./features/auth/application/auth-session.server"
import * as s from "./root.css"
import { ClientHintCheck, getHints } from "./utils/client-hints"
import { getDomainUrl } from "./utils/get-domain-url.server"
import { getImgSrc } from "./utils/get-img-src"
import { useNonce } from "./utils/nonce-provider"
import { securityMiddleware } from "./utils/security-middleware.server"

export const middleware = [securityMiddleware, authMiddleware]

export async function loader({ request }: Route.LoaderArgs) {
  const env = getServerEnv()
  const viewerId = await getUserId(request)
  const featureData = loadRootFeatureData({ viewerId })

  return data({
    allowIndexing: env.ALLOW_INDEXING,
    ENV: {
      ...createClientFeatureEnv(),
      MODE: env.NODE_ENV,
      POSTHOG_API_HOST: env.POSTHOG_API_HOST,
      POSTHOG_API_KEY: env.POSTHOG_API_KEY,
      SENTRY_DSN: env.SENTRY_DSN,
      SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
      SENTRY_RELEASE: env.SENTRY_RELEASE,
      SENTRY_TRACES_SAMPLE_RATE: env.SENTRY_TRACES_SAMPLE_RATE?.toString(),
    },
    isAuthenticated: Boolean(viewerId),
    requestInfo: {
      hints: getHints(request),
      origin: getDomainUrl(request),
      path: new URL(request.url).pathname,
    },
    ...featureData,
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
      lang={appConfig.locale}
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
        <title>{appConfig.name}</title>
        <meta content={appConfig.description} name="description" />
        <meta content={appConfig.name} name="application-name" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content={appConfig.shortName} name="apple-mobile-web-app-title" />
        <meta content="telephone=no" name="format-detection" />
        <meta
          content={appConfig.themeColor.light}
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content={appConfig.themeColor.dark}
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
        <link href="/manifest.webmanifest" rel="manifest" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
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
          {rootData?.viewerId ? (
            <AuthenticatedFeatureProvidersComponent
              viewerId={rootData.viewerId}
            >
              {children}
            </AuthenticatedFeatureProvidersComponent>
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
