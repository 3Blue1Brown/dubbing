import type { ComponentProps } from "react";
import { LuAsterisk } from "react-icons/lu";
import clsx from "clsx";
import classes from "./TextBox.module.css";

type Props = {
  onChange: (value: string) => void;
} & Omit<ComponentProps<"input">, "onChange">;

const TextBox = ({ className, onChange, children, ...props }: Props) => {
  return (
    <label>
      <span>
        {children}
        {props.required && <LuAsterisk className="required" />}
      </span>
      <input
        className={clsx(classes.textbox, className)}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
};

export default TextBox;
