import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { generateToken, Payload } from "../utils";
import { HTTP401Error } from "../utils/httpErrors";
import { JWT_SECRET } from "../config";

export const refreshToken = ({ _id, email }: Payload) => {
  return generateToken({ _id, email });
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization as string;

  if (!token) {
    console.log("No authorization header", req.headers);
    throw new HTTP401Error("No authorization header found");
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET as jwt.Secret);
    const refreshed = refreshToken((decodedToken as Payload));
    // Automatically refresh the user's token each time they pass a route.
    res.set("Authorization", refreshed);
    next();
  } catch (e) {
    throw new HTTP401Error();
  }
};
