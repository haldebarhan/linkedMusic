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
