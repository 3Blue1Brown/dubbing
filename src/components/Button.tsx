import { type ComponentProps, type Ref } from "react";
import clsx from "clsx";
import classes from "./Button.module.css";

type Props = {
  ref?: Ref<HTMLButtonElement>;
  accent?: boolean;
  square?: boolean;
} & ComponentProps<"button">;

const Button = ({
  ref,
  accent = false,
  square = false,
  className,
  children,
  ...props
}: Props) => {
  return (
    <button
      ref={ref}
      {...props}
      className={clsx(
        className,
        classes.button,
        accent && classes.accent,
        square && classes.square,
      )}
    >
      {children}
    </button>
  );
};

export default Button;
