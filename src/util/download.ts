import { wrap } from "comlink";
import EncodeWorker from "@/audio/encode.worker?worker";
import type { MP3Params } from "@/audio/encode.worker.ts";
import * as encodeWorkerAPI from "@/audio/encode.worker.ts";

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

/** create worker */
const encodeWorker = wrap<typeof encodeWorkerAPI>(new EncodeWorker());

/** encode and save mp3 */
export const downloadMp3 = async (
  data: Float32Array,
  params: MP3Params,
  filename: Filename,
) => {
  const blob = await encodeWorker.encodeMp3(data, params);
  const url = window.URL.createObjectURL(blob);
  download(url, filename, "mp3");
  window.URL.revokeObjectURL(url);
};
