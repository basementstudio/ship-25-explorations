import type { MetadataRoute } from "next"

import { siteURL } from "~/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteURL.href,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1
    }
  ]
}
