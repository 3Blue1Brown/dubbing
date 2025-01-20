import { forwardRef, type ComponentProps, type Ref } from "react";
import Button from "@/components/Button";

type Props = {
  checked: boolean;
  label: string;
} & ComponentProps<"button">;

const CheckButton = forwardRef(
  (
    { checked, label, children, ...props }: Props,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <Button
        ref={ref}
        {...props}
        square
        accent={checked}
        role="checkbox"
        data-tooltip={label}
        aria-checked={checked ? "true" : "false"}
      >
        {children}
      </Button>
    );
  },
);

export default CheckButton;
