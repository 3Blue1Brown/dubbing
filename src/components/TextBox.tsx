import type { ComponentProps } from "react";
import clsx from "clsx";
import classes from "./TextBox.module.css";

type Props = {
  onChange: (value: string) => void;
} & Omit<ComponentProps<"input">, "onChange">;

const TextBox = ({ className, onChange, ...props }: Props) => {
  return (
    <input
      className={clsx(classes.textbox, className)}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  );
};

export default TextBox;
