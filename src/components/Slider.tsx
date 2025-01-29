import type { ComponentProps } from "react";
import clsx from "clsx";
import classes from "./Slider.module.css";

type Props = {
  onChange: (value: number) => void;
} & Omit<ComponentProps<"input">, "onChange">;

const Slider = ({ className, onChange, ...props }: Props) => {
  return (
    <input
      className={clsx(classes.slider, className)}
      type="range"
      onChange={(event) => onChange(Number(event.target.value))}
      {...props}
    />
  );
};

export default Slider;
