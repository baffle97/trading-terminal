"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi } from "lightweight-charts";

interface DataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
}

export function LineChart({ data, height = 200 }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#9090a0",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#2a2a3620" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        horzLine: { visible: false },
      },
    });

    const isPositive =
      data.length >= 2 && data[data.length - 1].close >= data[0].close;
    const lineColor = isPositive ? "#22c55e" : "#ef4444";

    const lineSeries = chart.addAreaSeries({
      lineColor,
      topColor: isPositive ? "#22c55e30" : "#ef444430",
      bottomColor: "transparent",
      lineWidth: 2,
    });

    lineSeries.setData(
      data.map((d) => ({
        time: d.time as Parameters<typeof lineSeries.setData>[0][0]["time"],
        value: d.close,
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} className="w-full" />;
}
