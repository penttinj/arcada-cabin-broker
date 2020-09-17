/* eslint-disable no-restricted-syntax */
import {
  Router, Request, Response, NextFunction,
} from "express";
import winston from "winston";
import jwt from "jsonwebtoken";
import config from "../config";

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

if (config.NODE_ENV === 'development') {
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
  if (config.JWT_SECRET) {
    const token = jwt.sign(payload, config.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "5m", // Seems like a decent time for a session since tokens get refreshed on each req
      });

    return token;
  }
  throw new Error("JWT_SECRET not set!");
};

export const getIdFromToken = (token: string) => {
  if (!config.JWT_SECRET) throw new Error("JWT_SECRET not set!");
  const { _id } = (jwt.verify(token, config.JWT_SECRET) as Payload);
  return _id;
};
