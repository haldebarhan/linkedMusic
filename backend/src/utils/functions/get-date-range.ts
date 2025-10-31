import { Period } from "../types/period";
import createError from "http-errors";

export const getDateRange = (period: Period) => {
  const end = new Date();
  let start = new Date();

  switch (period) {
    case "1d":
      start.setDate(end.getDate() - 1);
      break;
    case "1w":
      start.setDate(end.getDate() - 7);
      break;
    case "1m":
      start.setMonth(end.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(end.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(end.getMonth() - 6);
      break;
    default:
      throw createError(400, `Période non prise en charge: ${period}`);
  }
  return { start, end };
};
