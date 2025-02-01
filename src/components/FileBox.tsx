import type { ComponentProps } from "react";
import { LuAsterisk } from "react-icons/lu";
import clsx from "clsx";
import classes from "./TextBox.module.css";

type Props = {
  onChange: (content: string, name: string) => void;
} & Omit<ComponentProps<"input">, "onChange">;

const FileBox = ({ className, onChange, children, ...props }: Props) => {
  return (
    <label>
      <span>
        {children}
        {props.required && <LuAsterisk className="required" />}
      </span>
      <input
        type="file"
        className={clsx(classes.textbox, className)}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const content = await file.text();
          onChange(content, file.name);
        }}
        {...props}
      />
    </label>
  );
};

export default FileBox;
