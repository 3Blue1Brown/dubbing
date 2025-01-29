import { type ComponentProps, type Ref } from "react";
import Button from "@/components/Button";

type Props = {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
} & Omit<ComponentProps<"button">, "onChange">;

const CheckButton = ({
  ref,
  label,
  checked,
  onChange,
  children,
  ...props
}: Props) => {
  return (
    <Button
      ref={ref}
      {...props}
      square
      accent={checked}
      role="checkbox"
      onClick={() => onChange(!checked)}
      data-tooltip={label}
      aria-checked={checked ? "true" : "false"}
    >
      {children}
    </Button>
  );
};

export default CheckButton;
