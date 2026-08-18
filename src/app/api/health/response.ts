const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function healthResponse(body: object, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}
