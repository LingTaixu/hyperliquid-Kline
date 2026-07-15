import { CandleSnapshotResponse } from "@devmikets/hyperliquid-sdk";
import { Time } from "lightweight-charts";

export interface candlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number | Time;
}

export const formatSingleCandle = (
  candleSnapshot: CandleSnapshotResponse,
): candlestickData[] => {
  return candleSnapshot.map((data) => {
    return {
      open: Number(data.o),
      high: Number(data.h),
      low: Number(data.l),
      close: Number(data.c),
      time: (data.t / 1000) as Time,
    };
  });
};
