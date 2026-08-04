import { appConfig } from "../config/app-config"

export function loader() {
  return Response.json(
    {
      background_color: appConfig.backgroundColor,
      description: appConfig.description,
      display: appConfig.display,
      icons: appConfig.icons,
      lang: appConfig.locale,
      name: appConfig.name,
      scope: appConfig.scope,
      short_name: appConfig.shortName,
      start_url: appConfig.startUrl,
      theme_color: appConfig.themeColor.light,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/manifest+json; charset=utf-8",
      },
    },
  )
}
