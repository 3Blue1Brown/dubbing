export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = String(Math.floor(time % 60)).padStart(2, "0");
  const ms = String(Math.floor((time % 1) * 1000)).padStart(3, "0");
  return `${minutes}:${seconds}.${ms}`;
};
