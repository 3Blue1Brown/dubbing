/** get value of css variable on element */
export const getCSSVar = (
  property: `--${string}`,
  target = document.documentElement,
) => window.getComputedStyle(target).getPropertyValue(property);
