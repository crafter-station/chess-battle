import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from "@electric-sql/client";
import { ELECTRIC_URL } from "@/lib/electric";
import { getUser } from "@/lib/get-user";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Construct the upstream URL
  const originUrl = new URL(ELECTRIC_URL);

  // Only pass through Electric protocol parameters
  url.searchParams.forEach((value, key) => {
    if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
      originUrl.searchParams.set(key, value);
    }
  });

  // Set the table server-side - not from client params
  originUrl.searchParams.set(`table`, `battle`);

  //
  // Authentication and authorization
  //

  const userId = await getUser();

  // Filter data by user ID - each user can only see their own battles
  originUrl.searchParams.set(`where`, `"user_id" = '${userId}'`);

  const response = await fetch(originUrl);

  // Fetch decompresses the body but doesn't remove the
  // content-encoding & content-length headers which would
  // break decoding in the browser.
  //
  // See https://github.com/whatwg/fetch/issues/1729
  const headers = new Headers(response.headers);
  headers.delete(`content-encoding`);
  headers.delete(`content-length`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
