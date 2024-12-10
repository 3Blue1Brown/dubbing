import type { ComponentProps, ReactNode } from "react";

type Props = {
  label: ReactNode;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
} & Omit<ComponentProps<"select">, "onChange">;

const Select = ({ label, options, onChange, ...props }: Props) => (
  <label>
    {label}
    <select {...props} onChange={(event) => onChange?.(event.target.value)}>
      {options.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </select>
  </label>
);

export default Select;
