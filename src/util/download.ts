export type Filename = string | string[];

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
