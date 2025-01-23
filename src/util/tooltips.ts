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

/** update element tolltip */
const update = (element: Element & { _tippy?: Instance }) => {
  if (!element.isConnected) return element._tippy?.destroy();

  const content = element.getAttribute("data-tooltip")?.trim() || "";

  if (!content) return element._tippy?.destroy();

  const instance = element._tippy ?? tippy(element, options);

  instance.setContent(content);

  if (!element.textContent?.trim()) element.setAttribute("aria-label", content);

  if (instance.popperInstance)
    window.setTimeout(instance.popperInstance.update, 20);
};

window.addEventListener("load", init);
