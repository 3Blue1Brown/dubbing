import { forwardRef, type ComponentProps, type Ref } from "react";
import clsx from "clsx";

type Props = {
  checked: boolean;
  label: string;
} & ComponentProps<"button">;

const CheckButton = forwardRef(
  (
    { checked, label, className, children, ...props }: Props,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <button
        ref={ref}
        {...props}
        className={clsx(checked && "checked", className)}
        role="checkbox"
        data-tooltip={label}
        aria-checked={checked ? "true" : "false"}
      >
        {children}
      </button>
    );
  },
);

export default CheckButton;
