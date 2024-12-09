import { type ComponentProps } from "react";
import clsx from "clsx";

type Props = {
  checked: boolean;
  label: string;
} & ComponentProps<"button">;

const CheckButton = ({
  checked,
  label,
  className,
  children,
  ...props
}: Props) => {
  return (
    <button
      {...props}
      className={clsx(checked && "accent", className)}
      role="checkbox"
      data-tooltip={label}
      aria-checked={checked ? "true" : "false"}
    >
      {children}
    </button>
  );
};

export default CheckButton;
