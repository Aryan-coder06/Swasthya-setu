"use client";

import { useEffect, useState } from "react";

type Spark = {
  id: number;
  x: number;
  y: number;
  hue: number;
};

const ClickSpark = () => {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const id = Date.now() + Math.random();
      const hue = 150 + Math.floor(Math.random() * 40); // around aqua tones
      const spark: Spark = {
        id,
        x: event.clientX,
        y: event.clientY,
        hue,
      };
      setSparks((prev) => [...prev, spark]);

      window.setTimeout(() => {
        setSparks((prev) => prev.filter((item) => item.id !== id));
      }, 600);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 animate-click-spark"
          style={{
            left: spark.x,
            top: spark.y,
            background: `radial-gradient(circle at center, hsl(${spark.hue} 85% 65%) 0%, transparent 70%)`,
            boxShadow: `0 0 26px 6px hsla(${spark.hue} 85% 65% / 0.55)`,
          }}
        />
      ))}
    </div>
  );
};

export default ClickSpark;
