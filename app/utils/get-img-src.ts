import type { GetSrcArgs } from "openimg/react";
import { defaultGetSrc } from "openimg/react";

export function getImgSrc({
  fit,
  format,
  height,
  optimizerEndpoint,
  src,
  width,
}: GetSrcArgs) {
  if (src.startsWith(optimizerEndpoint)) {
    const [endpoint, query] = src.split("?");
    const searchParams = new URLSearchParams(query);
    searchParams.set("w", width.toString());
    searchParams.set("h", height.toString());
    if (fit) searchParams.set("fit", fit);
    if (format) searchParams.set("format", format);
    return `${endpoint}?${searchParams.toString()}`;
  }
  return defaultGetSrc({ fit, format, height, optimizerEndpoint, src, width });
}
