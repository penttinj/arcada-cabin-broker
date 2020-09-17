/* eslint-disable no-unused-expressions */
import { Request, Response, NextFunction } from 'express';
import mongoose, { Types, Document } from "mongoose";
import { getIdFromToken } from "../../utils";
import { Booking, BookingDocument } from "./bookingsModel";
import { HTTP400Error, HTTP403Error, HTTP404Error } from '../../utils/httpErrors';
import { Cabin, CabinDocument } from '../cabins/cabinsModel';
import { Advert } from '../adverts/advertsModel';

/*
* This is a list of checking middlewares for bookings
*/

export const advertExists = async (req: Request, res: Response, next: NextFunction) => {
  const result = await Advert.findById(req.body.advertId);
  if (result) {
    next();
  } else {
    next(new HTTP404Error("Advert not found"));
  }
};

export const isSameUser = async (req: Request, res: Response, next: NextFunction) => {
  const currentUserId = getIdFromToken(req.headers.authorization as string);
  const booking = await Booking.findById(req.params.bookingId);
  if (booking) {
    const bookingUserId = (booking.bookingUser as Types.ObjectId).toHexString();
    if (currentUserId === (bookingUserId)) {
      next();
    } else {
      console.warn("did not equal", bookingUserId);
      next(new HTTP403Error());
    }
  } else {
    next(new HTTP404Error("Booking not found"));
  }
};

type DocumentWithDates = mongoose.Document & {
  startDate: Date,
  endDate: Date,
}

/**
 * @param model A model that contains startDate and endDate
 * @param id The document Id
 * @returns Array, in the shape of [startDate, endDate]
 */
const getDatesAsUnixFromModel = async (model: mongoose.Model<DocumentWithDates>, id: string) => {
  const result = await model.findById(id);
  if (result) {
    return [
      result.startDate.getTime(),
      result.endDate.getTime(),
    ];
  }
  throw new HTTP404Error();
};

const convertDocumentDatesToUnix = (doc: DocumentWithDates) => {
  return [
    doc.startDate.getTime(),
    doc.endDate.getTime(),
  ];
};

export const compareAgainstDocDates = (
  incomingStartD: number,
  incomingEndD: number,
  modelStartD: number,
  modelEndD: number,
) => {
  if ((incomingStartD >= modelStartD && incomingStartD <= modelEndD)
      && (incomingEndD <= modelEndD && incomingEndD >= modelStartD)) {
    return true;
  }
  return false;
};

export const checkDates = async (req: Request, res: Response, next: NextFunction) => {
  // TODO: Check no conflicting other bookings for same ad
  const now = new Date(new Date().toDateString()).getTime();
  const startD = new Date(req.body.startDate).getTime();
  const endD = new Date(req.body.endDate).getTime();

  const { advertId } = req.body;

  try {
    const [advertStartD, advertEndD] = await getDatesAsUnixFromModel(Advert, advertId);
    const datesFallWithinModel = compareAgainstDocDates(startD, endD, advertStartD, advertEndD);

    const bookingsForSameAdvert = await Booking.find({ advert: advertId });
    bookingsForSameAdvert.forEach((booking) => {
      const [bookingStartD, bookingEndD] = convertDocumentDatesToUnix(booking);
      const conflictingDates = compareAgainstDocDates(startD, endD, bookingStartD, bookingEndD);
      if (conflictingDates) {
        throw new HTTP400Error("An existing booking conflicts with wanted dates");
      }
    });

    if (datesFallWithinModel) {
      if (startD > endD) {
        throw new HTTP400Error("Start date is bigger than end");
      } else if (startD < now || endD < now) {
        throw new HTTP400Error("Dates can't be in the past");
      } else {
        // Dates are OK
        next();
      }
    } else {
      throw new HTTP400Error("The suggested dates don't fall within the model's dates");
    }
  } catch (e) {
    next(e);
  }
};

export const checkUpdatedDates = async (req: Request, res: Response, next: NextFunction) => {
  // this middleware checks that an updated date isn't wrong. It couldn't easily be checked
  // with the model's own functionality
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (booking) {
      const updatedStartD = new Date(req.body.startDate).getTime();
      const updatedEndD = new Date(req.body.endDate).getTime();
      const adStartD = new Date(booking.startDate).getTime();
      const adEndD = new Date(booking.endDate).getTime();

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
      next(new HTTP404Error("Booking not found"));
    }
  } catch (e) {
    next(e);
  }
};
