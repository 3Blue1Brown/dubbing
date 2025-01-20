import { forwardRef, type ComponentProps, type Ref } from "react";
import clsx from "clsx";
import classes from "./Button.module.css";

type Props = {
  accent?: boolean;
  square?: boolean;
} & ComponentProps<"button">;

const Button = forwardRef(
  (
    { accent = false, square = false, className, children, ...props }: Props,
    ref: Ref<HTMLButtonElement>,
  ) => {
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
        role="checkbox"
      >
        {children}
      </button>
    );
  },
);

export default Button;
