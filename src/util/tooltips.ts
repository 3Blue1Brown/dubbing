import tippy, { type Instance, type Props } from "tippy.js";
import "tippy.js/dist/tippy.css";

const options: Partial<Props> = {
  delay: [50, 0],
  duration: [100, 100],
  offset: [0, 15],
  allowHTML: true,
  appendTo: document.body,
  // onHide: () => false,
};

const init = () => {
  updateAll();
  /** watch for any data attr changes in document */
  new MutationObserver(updateAll).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-tooltip"],
  });
};

/** update all elements with data attr */
const updateAll = () =>
  document.querySelectorAll("[data-tooltip]").forEach(update);

/** update element tooltip */
const update = (element: Element & { _tippy?: Instance }) => {
  /** if element detached from dom, dispose */
  if (!element.isConnected) return element._tippy?.destroy();

  /** get content to put in tooltip from element attribute */
  const content = element.getAttribute("data-tooltip")?.trim() || "";

  /** if no/empty content, dispose */
  if (!content) return element._tippy?.destroy();

  /** get existing tippy instance on element, or create new one */
  const instance = element._tippy ?? tippy(element, options);

  /** set tooltip content */
  instance.setContent(content);

  /** if no screen-reader-readable text within element, add aria label */
  if (!element.textContent?.trim() && !element.getAttribute("aria-label"))
    element.setAttribute("aria-label", content);

  /** update position after waiting for layout shifts */
  if (instance.popperInstance)
    window.setTimeout(instance.popperInstance.update, 20);
};

window.addEventListener("load", init);
