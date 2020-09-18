/* eslint-disable no-unused-expressions */
import { Request, Response, NextFunction } from 'express';
import mongoose, { Types, Document } from "mongoose";
import { getIdFromToken } from "../../utils";
import { Booking, BookingDocument } from "./bookingsModel";
import { HTTP400Error, HTTP403Error, HTTP404Error } from '../../utils/httpErrors';
import { Advert } from '../adverts/advertsModel';
import { getDatesAsUnixFromModel, convertDocumentDatesToUnix, checkDocDates } from '../../utils/checkUtils';

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

export const checkDates = async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date(new Date().toDateString()).getTime();
  const startD = new Date(req.body.startDate).getTime();
  const endD = new Date(req.body.endDate).getTime();
  const { advertId } = req.body;

  try {
    const [advertStartD, advertEndD] = await getDatesAsUnixFromModel(Advert, advertId);

    const bookingsForSameAdvert = await Booking.find({ advert: advertId });
    // Check for conflicts in other bookings that book the same advert
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
      const [advertStartD, advertEndD] = await getDatesAsUnixFromModel(
        Advert, booking.advert as Types.ObjectId,
      );
      const bookingsForSameAdvert = await Booking.find({ advert: booking.advert });
      let startDate = bookingStartD,
        endDate = bookingEndD; // placeholder values

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

      const datesFallWithinAdvert = checkDocDates(
        bodyStartD, bodyEndD, advertStartD, advertEndD, "within",
      );
      if (!datesFallWithinAdvert) {
        throw new HTTP400Error("The updated dates don't fall within the model's dates");
      }

      // Check other bookings for conflicts with the new dates
      bookingsForSameAdvert.forEach((_booking) => {
        // Skip checking the booking we are modifying
        if (_booking._id.toHexString() !== bookingId) {
          const [thisBookingStartD, thisBookingEndD] = convertDocumentDatesToUnix(_booking);
          const conflictingDates = checkDocDates(
            startDate, endDate, thisBookingStartD, thisBookingEndD, "collision",
          );
          if (conflictingDates) {
            console.log("conflicting booking's Id:", _booking._id.toHexString());
            throw new HTTP400Error("An existing booking conflicts with wanted dates");
          }
        }
      });

      // The dates are OK
      next();
    } else {
      throw new HTTP404Error("Booking not found");
    }
  } catch (e) {
    next(e);
  }
};
