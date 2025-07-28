import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const ValidateDtoMiddleware = <T extends object>(
  dtoClass: new (...args: any[]) => T
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          message: "Request body is missing or empty",
        });
        return;
      }

      const dtoInstance = plainToInstance(dtoClass, req.body);

      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: false,
        skipMissingProperties: false,
        forbidUnknownValues: true,
      });

      if (errors.length > 0) {
        const formattedErrors = flattenValidationErrors(errors);
        res.status(422).json({ errors: formattedErrors });
        return;
      }

      req.body = dtoInstance;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({
        message: "An unexpected error occurred during validation",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal Server Error",
      });
    }
  };
};

// Fonction récursive pour aplatir les erreurs de validation
function flattenValidationErrors(errors: any[], parentPath = ""): any[] {
  const result: any[] = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      result.push({
        field: fieldPath,
        messages: Object.values(error.constraints),
      });
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return result;
}
