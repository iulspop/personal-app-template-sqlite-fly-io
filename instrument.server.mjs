import * as Sentry from "@sentry/react-router";

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.NODE_ENV,
	tracesSampleRate: 1.0,
});
