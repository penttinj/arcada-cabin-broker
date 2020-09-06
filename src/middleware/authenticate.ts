import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HTTP401Error } from "../utils/httpErrors";
import { JWT_SECRET } from "../config";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization as string;

  if (!token) {
    console.log("No authorization header");
    throw new HTTP401Error();
  }

  try {
    const verify = jwt.verify(token, JWT_SECRET as jwt.Secret);
    next();
  } catch (e) {
    throw new HTTP401Error();
  }
};
