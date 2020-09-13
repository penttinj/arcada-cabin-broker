import {
  Request, Response, NextFunction, Router,
} from "express";
import * as ErrorHandler from "../utils/errorHandler";

const handle404Error = (router: Router) => {
  router.use((req: Request, res: Response) => {
    // If this middleware is entered then it means no routes were matched,
    // and reached here with no error attached to the callback. So handleClientError
    // will match this.
    ErrorHandler.notFoundError();
  });
};

const handleClientError = (router: Router) => {
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    ErrorHandler.clientError(err, res, next);
  });
};

const handleServerError = (router: Router) => {
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    ErrorHandler.serverError(err, res, next);
  });
};

export default [handle404Error, handleClientError, handleServerError];
