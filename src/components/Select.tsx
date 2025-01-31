import type { ComponentProps } from "react";
import classes from "./Select.module.css";

type Props = {
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
} & Omit<ComponentProps<"select">, "onChange">;

const Select = ({ options, onChange, children, ...props }: Props) => (
  <label>
    {children}
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
