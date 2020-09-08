/* eslint-disable no-restricted-syntax */
import {
  Router, Request, Response, NextFunction,
} from "express";
import winston from "winston";
import jwt from "jsonwebtoken";
import { NODE_ENV, JWT_SECRET } from "../config";

type TWrapper = ((router: Router) => void);

export const applyRoutes = (
  routes: TWrapper[],
  app: Router,
) => {
  for (const route of routes) {
    route(app);
  }
};

export const logger: winston.Logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: {
    get time() { return new Date().toLocaleString(); },
  },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "api.log" }),
  ],
});

if (NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: "silly",
  }));
}

export type Payload = {
  _id: string
  email: string,
}

export const generateToken = (payload: Payload) => {
  if (JWT_SECRET) {
    const token = jwt.sign(payload, JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "5m",
      });

    return token;
  }
  throw new Error("JWT_SECRET not set!");
};

export const isSameUser = (req: Request, res: Response, next: NextFunction) => {
  console.log("");

};