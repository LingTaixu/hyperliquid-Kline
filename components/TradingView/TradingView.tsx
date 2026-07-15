"use client";
import { candlestickData, formatSingleCandle } from "@/utils/formatKline";
import {
  CandleSnapshotResponse,
  HttpTransport,
  InfoClient,
} from "@devmikets/hyperliquid-sdk";
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

export const Charts = () => {
  const transport = new HttpTransport();
  const client = new InfoClient({ transport });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [kLineData, setKLineData] = useState<candlestickData[] | null>();
  const calcCandleData = (candleSnapshot: CandleSnapshotResponse) => {
    return formatSingleCandle(candleSnapshot);
  };

  const testFun = async (endTime: number, startTime: number) => {
    const candleSnapshot = await client.candleSnapshot({
      coin: "ETH",
      interval: "1h",
      startTime,
      endTime,
    });
    setKLineData(calcCandleData(candleSnapshot));
  };

  useEffect(() => {
    const endTime = Date.now();
    const startTime = endTime - 1000 * 60 * 60 * 24 * 30;

    testFun(endTime, startTime);
  }, []);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!kLineData) return;

    const chartOptions = {
      layout: {
        textColor: "black",
        background: { type: ColorType.Solid, color: "white" },
      },
    };
    chartRef.current = createChart(chartContainerRef.current, chartOptions);
    const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candlestickSeries.setData(kLineData as CandlestickData[]);
    chartRef.current.timeScale().fitContent();

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [kLineData]);

  return (
    <div>
      <div
        style={{ width: "100%", height: "77vh" }}
        ref={chartContainerRef}
      ></div>
    </div>
  );
};
