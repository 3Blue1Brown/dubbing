export const sleep = (ms = 0) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/** create resettable countdown with callbacks */
export const countdown = (time: number, onDone: () => void) => {
  let timer: number;

  const reset = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(onDone, time);
  };

  reset();

  return reset;
};
