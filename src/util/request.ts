/** basic fetch and parse */
export async function request<Response>(
  url: string | URL,
  parse: "json" | "text" = "json",
) {
  url = new URL(url);
  const request = new Request(url);
  const response = await fetch(request);
  if (!response.ok) throw Error("Response not OK");
  let parsed: Response;
  try {
    parsed =
      parse === "text"
        ? await response.clone().text()
        : await response.clone().json();
  } catch (error) {
    throw Error(`Couldn't parse response as ${parse}, ${error}`);
  }
  return parsed;
}
