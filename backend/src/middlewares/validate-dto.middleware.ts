import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

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
					message: 'Request body is missing or empty',
				});
				return;
			}

			const dtoInstance = plainToInstance(dtoClass, req.body);
			const errors = await validate(dtoInstance);

			if (errors.length > 0) {
				res.status(422).json({
					errors: errors.map((err) => ({
						field: err.property,
						messages: Object.values(err.constraints || {}),
					})),
				});
				return;
			}
			req.body = dtoInstance;
			next();
		} catch (error) {
			console.error('Validation middleware error:', error);
			res.status(500).json({
				message: 'An unexpected error occurred during validation',
				error:
					process.env.NODE_ENV === 'development'
						? error.message
						: 'Internal Server Error',
			});
		}
	};
};
