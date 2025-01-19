import { wrap } from "comlink";
import type { MP3Params } from "@/util/encode.ts";
import Worker from "./encode?worker";

export type Filename = string | string[];

/** download file */
export const download = (url: string, filename: Filename, ext: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download =
    [filename]
      .flat()
      .map((part) =>
        part.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-+)|(-+$)/g, ""),
      )
      .filter(Boolean)
      .join("_")
      .replace(new RegExp("." + ext + "$"), "") +
    "." +
    ext;
  link.click();
};

type Encode = typeof import("./encode.ts");
const worker = wrap<Encode>(new Worker());

/** encode and save mp3 */
export const saveMp3 = async (
  data: Int16Array,
  params: MP3Params,
  filename: Filename,
) => {
  const blob = await worker.encodeMp3(data, params);
  const url = window.URL.createObjectURL(blob);
  download(url, filename, "mp3");
  window.URL.revokeObjectURL(url);
};
