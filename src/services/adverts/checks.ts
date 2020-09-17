/* eslint-disable no-unused-expressions */
import { Request, Response, NextFunction } from 'express';
import { Types } from "mongoose";
import { getIdFromToken } from "../../utils";
import { Advert, AdvertDocument } from "./advertsModel";
import { HTTP400Error, HTTP403Error, HTTP404Error } from '../../utils/httpErrors';
import { Cabin, CabinDocument } from '../cabins/cabinsModel';
import { convertDocumentDatesToUnix, checkDocDates } from '../../utils/checkUtils';

/*
* This is a list of checking middlewares for adverts
*/

export const isSameCabinOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loggedInUserId = getIdFromToken(req.headers.authorization as string);
    let result = (req.method === "POST" && req.url === "/")
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
        throw new HTTP403Error();
      }
    } else {
      throw new HTTP404Error("Cabin not found");
    }
  } catch (e) {
    next(e);
  }
};

export const checkDates = async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date(new Date().toDateString()).getTime();
  const startD = new Date(req.body.startDate).getTime();
  const endD = new Date(req.body.endDate).getTime();
  const { cabinId } = req.body;
  try {
    if (startD > endD) {
      throw new HTTP400Error("Start date is bigger than end");
    } else if (startD < now || endD < now) {
      throw new HTTP400Error("Dates can't be in the past");
    }

    const adsForSameCabin = await Advert.find({ cabin: cabinId });
    // Check for conflicts in other adverts that list the same cabin
    adsForSameCabin.forEach((ad) => {
      const [adStartD, adEndD] = convertDocumentDatesToUnix(ad);
      const conflictingDates = checkDocDates(startD, endD, adStartD, adEndD, "collision");
      if (conflictingDates) {
        throw new HTTP400Error("An existing advert conflicts with wanted dates");
      }
    });

    // Dates are OK
    next();
  } catch (e) {
    next(e);
  }
};

export const checkUpdatedDates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adId = req.params.advertId;
    const ad = await Advert.findById(adId);

    if (ad) {
      const bodyStartD = new Date(req.body.startDate).getTime();
      const bodyEndD = new Date(req.body.endDate).getTime();
      const adStartD = new Date(ad.startDate).getTime();
      const adEndD = new Date(ad.endDate).getTime();
      const adsForSameCabin = await Advert.find({ cabin: ad.cabin });
      let startDate = adStartD, endDate = adEndD; // placeholder values

      // Assign startDate and endDate depending on which values came with the request
      if (bodyStartD && bodyEndD) {
        startDate = bodyStartD;
        endDate = bodyEndD;
      } else if (bodyStartD && !bodyEndD) {
        startDate = bodyStartD;
        endDate = adEndD;
      } else if (!bodyStartD && bodyEndD) {
        startDate = adStartD;
        endDate = bodyEndD;
      }

      if (startDate > endDate) {
        throw new HTTP400Error("Updated date(s) conflict with eachother");
      }

      adsForSameCabin.forEach((ad) => {
        // Skip checking the advert we are modifying
        if (ad._id.toHexString() !== adId) {
          const [thisAdStartD, thisAdEndD] = convertDocumentDatesToUnix(ad);
          const conflictingDates = checkDocDates(
            startDate, endDate, thisAdStartD, thisAdEndD, "collision"
          );
          if (conflictingDates) {
            console.log("conflicting advert's Id:", ad._id.toHexString());
            throw new HTTP400Error("An existing advert conflicts with wanted dates");
          }
        }
      });
      
      // The updated advert's dates are OK
      next();
    } else {
      throw new HTTP404Error("Advert not found");
    }
  } catch (e) {
    next(e);
  }
};
