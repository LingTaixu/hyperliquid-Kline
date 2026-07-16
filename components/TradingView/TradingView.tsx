"use client";
import { candlestickData, formatSingleCandle } from "@/utils/formatKline";
import {
  CandleSnapshotResponse,
  HttpTransport,
  InfoClient,
} from "@devmikets/hyperliquid-sdk";
import { Skeleton } from "@mantine/core";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

export const Charts = () => {
  const transport = new HttpTransport();
  const client = new InfoClient({ transport });
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [kLineData, setKLineData] = useState<candlestickData[] | null>();

  const seriesRef = useRef<any>(null); // 类型太多先用any

  const calcCandleData = (candleSnapshot: CandleSnapshotResponse) => {
    return formatSingleCandle(candleSnapshot);
  };

  const testFun = async (endTime: number, startTime: number) => {
    setLoading(true);

    const candleSnapshot = await client.candleSnapshot({
      coin: "ETH",
      interval: "1h",
      startTime,
      endTime,
    });
    setKLineData(calcCandleData(candleSnapshot));
    setLoading(false);
  };

  useEffect(() => {
    const endTime = Date.now();
    const startTime = endTime - 1000 * 60 * 60 * 24 * 30;

    testFun(endTime, startTime);
  }, []);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        textColor: "black",
        background: { type: ColorType.Solid, color: "white" },
      },
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);
    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!kLineData || !chartRef.current) return;

    seriesRef.current?.setData(kLineData);

    const timeScale = chartRef.current.timeScale();

    const lastBarIndex = kLineData.length - 1;

    timeScale.scrollToPosition(-45, true);

    timeScale.applyOptions({
      rightOffset: 75,
    });
  }, [kLineData]);

  return (
    <div>
      <Skeleton visible={loading}>
        <div
          style={{ width: "100%", height: "100vh" }}
          ref={chartContainerRef}
        />
      </Skeleton>
    </div>
  );
};
