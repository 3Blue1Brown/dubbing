import { type ComponentProps, type Ref } from "react";
import Button from "@/components/Button";

type Props = {
  ref?: Ref<HTMLButtonElement>;
  checked: boolean;
  label: string;
} & ComponentProps<"button">;

const CheckButton = ({ ref, checked, label, children, ...props }: Props) => {
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
};

export default CheckButton;
