import { NextFunction, Request, Response } from "express";

export const ParseJsonMiddleware = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (req.body[field]) {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          res.status(400).json({
            errors: [
              {
                field,
                messages: [`${field} must be valid JSON`],
              },
            ],
          });
          return;
        }
      }
    }
    return next();
  };
};

export const parseMaybeJSON = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};
