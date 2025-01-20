import type { ComponentProps, ReactNode } from "react";
import classes from "./Select.module.css";

type Props = {
  label: ReactNode;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
} & Omit<ComponentProps<"select">, "onChange">;

const Select = ({ label, options, onChange, ...props }: Props) => (
  <label className={classes.label}>
    {label}
    <select
      className={classes.select}
      {...props}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {options.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </select>
  </label>
);

export default Select;
