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
const getDatesAsUnixFromModel = async (model: mongoose.Model<DocumentWithDates>, id: string | Types.ObjectId) => {
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

type Options = "within" | "collision";

export const checkDocDates = (
  incomingStartD: number,
  incomingEndD: number,
  modelStartD: number,
  modelEndD: number,
  within: Options,
) => {
  switch (within) {
    case "within":
      if ((incomingStartD >= modelStartD && incomingStartD <= modelEndD)
        && (incomingEndD <= modelEndD && incomingEndD >= modelStartD)) {
        return true;
      }
      return false;
      break;
    case "collision":
      if (
        (incomingStartD >= modelStartD && incomingStartD <= modelEndD)
        || (incomingEndD <= modelEndD && incomingEndD >= modelStartD)
        || (incomingStartD <= modelStartD && incomingEndD >= modelStartD)
        || (incomingEndD >= modelEndD && incomingStartD <= modelEndD)
      ) {
        return true;
      }
      return false;
      break;
    default:
      throw new Error("Invalid parameter for 'within'")
  }
};

export const checkDates = async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date(new Date().toDateString()).getTime();
  const startD = new Date(req.body.startDate).getTime();
  const endD = new Date(req.body.endDate).getTime();
  const { advertId } = req.body;


  try {
    const [advertStartD, advertEndD] = await getDatesAsUnixFromModel(Advert, advertId);


    const bookingsForSameAdvert = await Booking.find({ advert: advertId });

    bookingsForSameAdvert.forEach((booking) => {
      const [bookingStartD, bookingEndD] = convertDocumentDatesToUnix(booking);
      const conflictingDates = checkDocDates(startD, endD, bookingStartD, bookingEndD, "collision");
      if (conflictingDates) {
        throw new HTTP400Error("An existing booking conflicts with wanted dates");
      }
    });


    const datesFallWithinAdvert = checkDocDates(startD, endD, advertStartD, advertEndD, "within");

    if (datesFallWithinAdvert) {
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
      const bodyStartD = new Date(req.body.startDate).getTime();
      const bodyEndD = new Date(req.body.endDate).getTime();
      const bookingStartD = new Date(booking.startDate).getTime();
      const bookingEndD = new Date(booking.endDate).getTime();
      const [advertStartD, advertEndD] = await getDatesAsUnixFromModel(Advert, booking.advert as Types.ObjectId);
      const bookingsForSameAdvert = await Booking.find({ advert: booking.advert });

      let startDate = bookingStartD, endDate = bookingEndD; // placeholder values

      // Assign startDate and endDate depending on which values came with the request
      if (bodyStartD && bodyEndD) {
        startDate = bodyStartD;
        endDate = bodyEndD;
      } else if (bodyStartD && !bodyEndD) {
        startDate = bodyStartD;
        endDate = bookingEndD;
      } else if (!bodyStartD && bodyEndD) {
        startDate = bookingStartD;
        endDate = bodyEndD;
      }

      if (startDate > endDate) {
        throw new HTTP400Error("Updated date(s) conflict with eachother");
      }

      const datesFallWithinAdvert = checkDocDates(bodyStartD, bodyEndD, advertStartD, advertEndD, "within");
      if (!datesFallWithinAdvert) {
        throw new HTTP400Error("The updated dates don't fall within the model's dates");
      }
      
      console.log("bookingforsameadvert:", bookingsForSameAdvert);
      bookingsForSameAdvert.forEach((booking) => {
        const [thisBookingStartD, thisBookingEndD] = convertDocumentDatesToUnix(booking);
        const conflictingDates = checkDocDates(startDate, endDate, thisBookingStartD, thisBookingEndD, "collision");
        if (conflictingDates) {
          console.log("conflicting booking's Id:", booking._id.toHexString());
          throw new HTTP400Error("An existing booking conflicts with wanted dates");
        }
      });
      
      
      
      
      
      
      
      
      
      next();
    } else {
      throw new HTTP404Error("Booking not found");
    }
  } catch (e) {
    next(e);
  }
};
