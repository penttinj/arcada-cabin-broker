/* eslint-disable no-unused-expressions */
import { Request, Response, NextFunction } from 'express';
import { Types } from "mongoose";
import { getIdFromToken } from "../../utils";
import { Advert, AdvertDocument } from "./bookingsModel";
import { HTTP400Error, HTTP403Error, HTTP404Error } from '../../utils/httpErrors';
import { Cabin, CabinDocument } from '../cabins/cabinsModel';

/*
* This is a list of checking middlewares for adverts
*/

export const isSameCabinOwner = async (req: Request, res: Response, next: NextFunction) => {
  const loggedInUserId = getIdFromToken(req.headers.authorization as string);
  let result = (req.method === "POST" && req.url === "/register")
    ? await Cabin.findById(req.body.cabinId)
    : await Advert.findById(req.params.advertId).populate("cabin");
  if (result) {
    if ("cabin" in result) result = result.cabin as CabinDocument;
    const cabinUserId = (result.owner as Types.ObjectId).toHexString();
    if (loggedInUserId === (cabinUserId)) {
      console.log("Same cabin owner");
      next();
    } else {
      console.warn("did not equal", cabinUserId);
      next(new HTTP403Error());
    }
  } else {
    next(new HTTP404Error("Cabin not found"));
  }
};

export const checkDates = async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date(new Date().toDateString()).getTime();
  const startD = new Date(req.body.startDate).getTime();
  const endD = new Date(req.body.endDate).getTime();

  if (startD > endD) {
    next(new HTTP400Error("Start date is bigger than end"));
  } else if (startD < now || endD < now) {
    next(new HTTP400Error("Dates can't be in the past"));
  } else {
    next();
  }
};

export const checkUpdatedDates = async (req: Request, res: Response, next: NextFunction) => {
  // this middleware checks that an updated date isn't wrong. It couldn't easily be checked
  // with the model's own functionality
  try {
    const adId = req.params.advertId;
    const ad = await Advert.findById(adId);

    if (ad) {
      const updatedStartD = new Date(req.body.startDate).getTime();
      const updatedEndD = new Date(req.body.endDate).getTime();
      const adStartD = new Date(ad.startDate).getTime();
      const adEndD = new Date(ad.endDate).getTime();

      if (updatedStartD && !updatedEndD) {
        if (updatedStartD > adEndD) {
          next(new HTTP400Error("Updated startdate is later than enddate"));
        }
      } else if (!updatedStartD && updatedEndD) {
        if (updatedEndD < adStartD) {
          next(new HTTP400Error("Updated enddate is earlier than startdate"));
        }
      }
      next();
    } else {
      next(new HTTP404Error("Advert not found"));
    }
  } catch (e) {
    next(e);
  }
};
