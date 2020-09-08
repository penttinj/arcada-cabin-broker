import { Request, Response, NextFunction } from 'express';
import { validationResult } from "express-validator";
import { HTTP400Error } from "../utils/httpErrors";

export const handleValidatorResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Client input error:");
    console.log(errors.array());
    throw new HTTP400Error(`${errors.array()[0].param}: ${errors.array()[0].msg}`);
  } else next();
};
