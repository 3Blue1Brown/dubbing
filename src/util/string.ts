/** format time in seconds */
export const formatTime = (time: number, ms = false) => {
  const sign = time < 0 ? "-" : "";
  time = Math.abs(time);
  const minutes = Math.floor(time / 60);
  const seconds = ":" + String(Math.floor(time % 60)).padStart(2, "0");
  const milliseconds = ms
    ? "." + String(Math.floor((time % 1) * 1000)).padEnd(3, "0")
    : "";
  return [sign, minutes, seconds, milliseconds].join("");
};
