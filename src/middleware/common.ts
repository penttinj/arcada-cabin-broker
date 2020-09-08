import {
  Router, Request, Response, NextFunction,
} from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import { logger } from "../utils";

export const handleCors = (router: Router) => {
  router.use(cors({ credentials: true, origin: true }));
};

export const handleBodyRequestParsing = (router: Router) => {
  router.use(parser.urlencoded({ extended: true }));
  router.use(parser.json());
};

export const logTraffic = (router: Router) => {
  router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toLocaleString()}: ${req.method} ${req.url}`);
    const { url } = req;
    const time = new Date();
    logger.log({
      level: "info",
      message: `Received request for ${url}`,
      service: "traffic",
    });
    next();
  });
};

export const handleCompression = (router: Router) => router.use(compression());
