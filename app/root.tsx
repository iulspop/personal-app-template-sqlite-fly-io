import * as Sentry from "@sentry/react-router";
import { OpenImgContextProvider } from "openimg/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

import { ProgressBarComponent } from "./components/progress-bar";
import { authMiddleware } from "./features/auth/application/auth-middleware.server";
import {
  getLocale,
  i18nextMiddleware,
  localeCookie,
} from "./features/localization/i18next-middleware.server";
import { ClientHintCheck, getHints } from "./utils/client-hints";
import { getDomainUrl } from "./utils/get-domain-url.server";
import { getImgSrc } from "./utils/get-img-src";
import { useNonce } from "./utils/nonce-provider";
import { securityMiddleware } from "./utils/security-middleware.server";

export const middleware = [
  securityMiddleware,
  i18nextMiddleware,
  authMiddleware,
];

export async function loader({ context, request }: Route.LoaderArgs) {
  const locale = getLocale(context);
  return data(
    {
      allowIndexing: process.env.ALLOW_INDEXING !== "false",
      ENV: { MODE: process.env.NODE_ENV, SENTRY_DSN: process.env.SENTRY_DSN },
      locale,
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
      },
    },
    {
      headers: {
        "Set-Cookie": await localeCookie.serialize(locale),
      },
    },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<typeof loader>("root");
  const { i18n } = useTranslation();
  const nonce = useNonce();

  return (
    <html className="system" dir={i18n.dir()} lang={rootData?.locale ?? "en"}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
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
          {children}
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
  );
}

export default function App({ loaderData: { locale } }: Route.ComponentProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (error instanceof Error) {
    Sentry.captureException(error);
  }

  const { t } = useTranslation();

  let message = t("errorBoundary.oops");
  let details = t("errorBoundary.details");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message =
      error.status === 404
        ? t("errorBoundary.status404")
        : t("errorBoundary.statusError");
    details =
      error.status === 404
        ? t("errorBoundary.notFound")
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
