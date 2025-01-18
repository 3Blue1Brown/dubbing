/** format minutes and seconds */
export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = String(Math.floor(time % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/** format milliseconds */
export const formatMs = (time: number) =>
  String(Math.floor((time % 1) * 1000)).padStart(3, "0");
