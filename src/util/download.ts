import { pool } from "workerpool";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import EncodeWorker from "@/audio/encode.worker?worker&url";
import type { EncodeMp3, Mp3Params } from "@/audio/encode.worker.ts";

export type Filename = string | string[];

/** concat and path-safe file name parts */
const getFullFilename = (filename: Filename, ext: string) =>
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

/** download file */
export const downloadBlob = (blob: Blob, filename: Filename, ext: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getFullFilename(filename, ext);
  link.click();
  window.URL.revokeObjectURL(url);
};

/** create encoder worker pool */
const encoderPool = pool(EncodeWorker, {
  maxWorkers: 16,
  workerOpts: { type: import.meta.env.PROD ? undefined : "module" },
});

/** encode mp3 to blob */
export const getMp3 = (data: Float32Array, params: Mp3Params) =>
  encoderPool.exec<EncodeMp3>("encodeMp3", [
    data,
    params,
    /** https://github.com/josdejong/workerpool/issues/485 */
  ]) as unknown as Promise<Blob>;

/** download zip of multiple files */
export const downloadZip = async (
  files: { blob: Blob; filename: Filename; ext: string }[],
  filename: Filename,
) => {
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
  await Promise.all(
    files.map(({ blob, filename, ext }) =>
      zipWriter.add(getFullFilename(filename, ext), new BlobReader(blob)),
    ),
  );
  const blob = await zipWriter.close();
  downloadBlob(blob, filename, "zip");
};
