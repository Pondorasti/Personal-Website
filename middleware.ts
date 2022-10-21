import type { NextRequest, NextFetchEvent } from "next/server"
import { NextResponse } from "next/server"

const PUBLIC_FILE = /\.(.*)$/

export function middleware(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname

  // Ignore running this middleware when the request is to a serverless function or a file in public/.
  const isPageRequest = !PUBLIC_FILE.test(pathname) && !pathname.startsWith("/api")

  const sendAnalytics = async () => {
    const slug = pathname.slice(pathname.indexOf("/")) || "/"

    const url = req.nextUrl.clone()
    url.pathname = "/api/view"

    // Skip fetch if user agent is a bot
    if (req.headers.get("user-agent")?.includes("bot")) return

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
        }),
      })

      if (res.status !== 200) console.error("Failed to send analytics", res)
    } catch (error) {
      console.error(error)
    }
  }

  // Don't wait for sendAnalytics() to finish before continuing the response.
  if (isPageRequest) event.waitUntil(sendAnalytics())

  return NextResponse.next()
}
