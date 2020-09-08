import { Response, NextFunction } from "express";
import { HTTPClientError, HTTP404Error } from "./httpErrors";
import { NODE_ENV } from "../config";
import { logger } from ".";

interface StatusError extends Error {
  statusCode: number;
  responseBody: any;
}

type JsonError = {
  error: HTTPClientError["statusCode"];
  message: HTTPClientError["message"];
  stack?: string | undefined;
}

const jsonError = (message: string, error: number, stack?: string | undefined): JsonError => ({
  error,
  message,
  stack,
});

export const notFoundError = () => {
  throw new HTTP404Error("404 Resource not found!");
};

export const clientError = (err: Error, res: Response, next: NextFunction) => {
  if (err instanceof HTTPClientError) {
    console.log("Client Error:", err.message);
    res
      .status(err.statusCode)
      .json(jsonError(err.message, err.statusCode));
  } else {
    next(err);
  }
};

export const serverError = (err: Error | StatusError, res: Response, next: NextFunction) => {
  if (NODE_ENV === "production") {
    logger.error(err.stack);
    res
      .status(500)
      .json(jsonError("Internal Server Error", 500));
  } else if ((err as StatusError).responseBody) {
    logger.error({ message: err.stack, type: "Rejection", responseBody: (err as StatusError).responseBody });
    res
      .status(500)
      .json(jsonError("Rejection", 500, err.stack));
  } else {
    logger.error(err.stack);
    res
      .status(500)
      .json(jsonError("Internal Server Error", 500, err.stack));
  }
};
