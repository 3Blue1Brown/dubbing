import type { ComponentProps } from "react";
import clsx from "clsx";
import classes from "./TextBox.module.css";

type Props = {
  onChange: (value: string) => void;
} & Omit<ComponentProps<"input">, "onChange">;

const FileBox = ({ className, onChange, children, ...props }: Props) => {
  return (
    <label>
      <span>{children}</span>
      <input
        type="file"
        className={clsx(classes.textbox, className)}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const content = await file.text();
          onChange(content);
        }}
        {...props}
      />
    </label>
  );
};

export default FileBox;
