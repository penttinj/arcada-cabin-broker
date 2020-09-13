import { Request, Response, NextFunction } from 'express';
import { Types } from "mongoose";
import { getIdFromToken } from "../../utils";
import { Cabin, CabinDocument } from "./cabinsModel";
import { HTTP403Error, HTTP404Error } from '../../utils/httpErrors';

export const isSameUser = async (req: Request, res: Response, next: NextFunction) => {
  const currentUserId = getIdFromToken(req.headers.authorization as string);
  const cabin = await Cabin.findById(req.params.cabinId);
  if (cabin) {
    const cabinUserId = (cabin.owner as Types.ObjectId).toHexString();
    if (currentUserId === (cabinUserId)) {
      next();
    } else {
      console.warn("did not equal", cabinUserId);
      next(new HTTP403Error());
    }
  } else {
    next(new HTTP404Error("Cabin not found"));
  }
};
