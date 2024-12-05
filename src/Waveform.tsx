import { useCallback, useEffect, useRef } from "react";
import { useEventListener, useMeasure } from "@reactuses/core";
import "./App.css";
import { useClamped } from "./hooks";

type Props = {
  waveform: number[];
};

const Waveform = ({ waveform }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const [{ width, height }] = useMeasure(canvasRef);

  const stroke = "black";
  const scaleXMin = width / waveform.length;

  const [scaleX, setScaleX] = useClamped(scaleXMin, scaleXMin, 10);
  const [scaleY, setScaleY] = useClamped(1, 1, 10);

  const getTranslateXMin = useCallback(
    (scaleX: number) => width - scaleX * waveform.length,
    [width, waveform.length]
  );
  const translateXMin = getTranslateXMin(scaleX);

  const [translateX, setTranslateX] = useClamped(0, translateXMin, 0);
  const translateY = height / 2;

  const transform = new DOMMatrix()
    .translate(translateX, translateY)
    .scale(scaleX, scaleY);

  useEffect(() => {
    setScaleX(scaleXMin);
  }, [scaleXMin, setScaleX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current ??= canvas.getContext("2d");
    const ctx = ctxRef.current;
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(transform);
    ctx.moveTo(0, 0);
    waveform.forEach((y, x) => ctx.lineTo(x, y * height));
    ctx.restore();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const zoom = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const { deltaY, shiftKey, ctrlKey, clientX, clientY } = event;

      if (shiftKey) {
        const newScaleX = setScaleX(scaleX * 1.1 ** (deltaY > 0 ? 1 : -1));
        const { left = 0, top = 0 } =
          canvasRef.current?.getBoundingClientRect() || {};
        const mouse = new DOMPoint(clientX - left, clientY - top);
        const mouseX = transform.inverse().transformPoint(mouse).x;
        const newMouseX = new DOMMatrix()
          .translate(translateX, translateY)
          .scale(newScaleX, scaleY)
          .inverse()
          .transformPoint(mouse).x;
        setTranslateX(translateX + (newMouseX - mouseX) * newScaleX, {
          min: getTranslateXMin(newScaleX),
        });
      } else if (ctrlKey) setScaleY(scaleY * 1.1 ** (deltaY > 0 ? 1 : -1));
      else setTranslateX(translateX + deltaY);
    },
    [
      transform,
      getTranslateXMin,
      scaleX,
      scaleY,
      translateX,
      translateY,
      setScaleX,
      setScaleY,
      setTranslateX,
    ]
  );

  useEventListener("wheel", zoom, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "calc(100% - 60px)",
        height: "500px",
        margin: "30px",
        overflow: "visible",
        boxShadow: "1px 2px 5px #00000080",
      }}
    />
  );
};

export default Waveform;
