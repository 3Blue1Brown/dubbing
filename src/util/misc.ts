export const sleep = (ms = 0) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/** create resettable countdown with callbacks */
export const countdown = (
  time: number,
  onReset: () => void,
  onDone: () => void,
) => {
  let timer: number;

  const reset = () => {
    onReset();
    window.clearTimeout(timer);
    timer = window.setTimeout(onDone, time);
  };

  reset();

  return reset;
};
