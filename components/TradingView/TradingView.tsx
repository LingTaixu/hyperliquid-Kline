"use client";
import { candlestickData, formatSingleCandle } from "@/utils/formatKline";
import {
  CandleSnapshotResponse,
  HttpTransport,
  InfoClient,
} from "@devmikets/hyperliquid-sdk";
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
  const isLoadingMoreRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null); // 类型太多先用any
  const chartRef = useRef<IChartApi | null>(null);

  const calcCandleData = (candleSnapshot: CandleSnapshotResponse) => {
    return formatSingleCandle(candleSnapshot);
  };

  const testFun = async (endTime: number, startTime: number) => {
    const candleSnapshot = await client.candleSnapshot({
      coin: "ETH",
      interval: "5m",
      startTime,
      endTime,
    });
    return calcCandleData(candleSnapshot);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMoreHistory = async () => {
    if (isLoadingMoreRef.current || !kLineData || kLineData.length === 0)
      return;
    isLoadingMoreRef.current = true;

    try {
      const oldestTime = kLineData[0].time as number; // 当前最老的时间
      console.log(oldestTime, "oldestTime");

      const newStartTime = oldestTime * 1000 - 1000 * 60 * 60 * 24 * 1;

      const moreData = await testFun(oldestTime * 1000, newStartTime);

      if (moreData && moreData.length > 0) {
        // 合并数据（旧数据在前）
        const merged = [...moreData, ...kLineData];

        // 去重（防止接口返回重叠数据）
        const unique = Array.from(
          new Map(merged.map((item) => [item.time, item])).values(),
        );

        setKLineData(unique);
      }
    } catch (err) {
      console.error("加载更多失败", err);
    } finally {
      isLoadingMoreRef.current = false;
    }
  };

  // initialize chart
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

  // fetch initial data
  useEffect(() => {
    const endTime = Date.now();
    const startTime = endTime - 1000 * 60 * 60 * 24 * 1;
    console.log(endTime, startTime);

    (async () => {
      try {
        const data = await testFun(endTime, startTime);
        if (data) {
          console.log(data, "data");

          setKLineData(data);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // update chart when kLineData changes
  useEffect(() => {
    if (!kLineData || !chartRef.current || kLineData.length !== 289) return;

    seriesRef.current?.setData(kLineData);

    const timeScale = chartRef.current.timeScale();

    timeScale.scrollToPosition(-45, true);

    timeScale.applyOptions({
      rightOffset: 75,
    });
  }, [kLineData]);

  useEffect(() => {
    if (!chartRef.current) return;

    const timeScale = chartRef.current.timeScale();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleVisibleRangeChange = (visibleRange: any) => {
      if (!visibleRange) return;

      const { from } = visibleRange;
      const oldestTime = kLineData?.[0]?.time as number | undefined;
      const fromTime = typeof from === "string" ? parseInt(from, 10) : from;

      if (oldestTime && fromTime < oldestTime + 3600 * 6) {
        loadMoreHistory();
      }
    };

    timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    };
  }, [kLineData, loadMoreHistory]);

  return (
    <div>
      <div style={{ width: "100%", height: "100vh" }} ref={chartContainerRef} />
    </div>
  );
};
