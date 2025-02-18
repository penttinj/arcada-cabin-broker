import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { generateToken, getIdFromToken, Payload } from "../utils";
import { HTTP401Error, HTTP403Error } from "../utils/httpErrors";
import config from "../config";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization as string;

  if (!token) {
    console.log("No authorization header", req.headers);
    throw new HTTP401Error("No authorization header found");
  }

  try {
    const decodedToken = jwt.verify(token, config.JWT_SECRET);
    const refreshedToken = generateToken({
      _id: (decodedToken as Payload)._id,
      email: (decodedToken as Payload).email,
    });
    // Automatically refresh the user's token each time they get authenticated.
    res.set("Authorization", refreshedToken);
    next();
  } catch (e) {
    throw new HTTP401Error();
  }
};
