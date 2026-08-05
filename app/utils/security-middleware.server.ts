import { generalSecurity } from "@nichtsam/helmet/general"
import type { MiddlewareFunction } from "react-router"

import { getServerEnv } from "../config/server-env.server"

export const securityMiddleware: MiddlewareFunction = async (_, next) => {
  const response = (await next()) as Response

  generalSecurity(response.headers, {
    referrerPolicy: false,
  })

  const allowIndexing = getServerEnv().ALLOW_INDEXING
  if (!allowIndexing) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
  }

  return response
}
