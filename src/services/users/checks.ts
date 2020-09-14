import { Request, Response, NextFunction } from 'express';
import { getIdFromToken } from "../../utils";
import { HTTP403Error } from '../../utils/httpErrors';

export const isSameUser = (req: Request, res: Response, next: NextFunction) => {
  const currentUserId = getIdFromToken(req.headers.authorization as string);
  if (currentUserId === req.params.id) {
    next();
  } else {
    throw new HTTP403Error();
  }
};
