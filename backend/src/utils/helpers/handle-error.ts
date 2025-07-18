import { Response } from "express";
import { formatResponse } from "./response-formatter";

export const handleError = (res: Response, error: any): Response => {
  const status = error.status ?? 500;
  const response = formatResponse(status, { message: error.message });
  return res.status(status).json(response);
};
