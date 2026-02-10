import { constants, promises as fs } from "node:fs";
import { invariantResponse } from "@epic-web/invariant";
import { getImgResponse } from "openimg/node";

import type { Route } from "./+types/api.images";
import { getDomainUrl } from "~/utils/get-domain-url.server";

let cacheDir: string | null = null;

async function getCacheDir() {
  if (cacheDir) return cacheDir;
  let dir = "./tests/fixtures/openimg";
  if (process.env.NODE_ENV === "production") {
    const isAccessible = await fs
      .access("/data", constants.W_OK)
      .then(() => true)
      .catch(() => false);
    dir = isAccessible ? "/data/images" : "/tmp/openimg";
  }
  cacheDir = dir;
  return cacheDir;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return getImgResponse(request, {
    allowlistedOrigins: [getDomainUrl(request)],
    cacheFolder: await getCacheDir(),
    getImgSource: () => {
      const src = searchParams.get("src");
      invariantResponse(src, "src query parameter is required", {
        status: 400,
      });
      if (URL.canParse(src)) return { type: "fetch", url: src };
      if (src.startsWith("/assets")) return { path: `.${src}`, type: "fs" };
      return { path: `./public${src}`, type: "fs" };
    },
    headers,
  });
}
