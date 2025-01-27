/** basic fetch and parse */
export function request<Response>(url: Url, parse?: "json"): Promise<Response>;
export function request(url: Url, parse: "text"): Promise<string>;
export function request(url: Url, parse: "arrayBuffer"): Promise<ArrayBuffer>;
export async function request(url: Url, parse: Parse = "json") {
  const request = new Request(url);
  const response = await fetch(request);
  if (!response.ok) throw Error("Response not OK");
  try {
    if (parse === "json") return await response.clone().json();
    if (parse === "text") return await response.clone().text();
    if (parse === "arrayBuffer") return await response.clone().arrayBuffer();
  } catch (error) {
    throw Error(`Couldn't parse response as ${parse}, ${error}`);
  }
}

type Url = string;
type Parse = "json" | "text" | "arrayBuffer";
