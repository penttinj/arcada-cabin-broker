/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
import mongoose from "mongoose";
import { HTTP400Error, HTTP404Error } from "../../utils/httpErrors";
import { UserDocument } from "../users/usersModel";
import { AdvertDocument } from "../adverts/advertsModel";
import { Booking, BookingDocument } from "./bookingsModel";

interface BookingDetails {
  advert: string,
  bookingUser: string,
  startDate: Date,
  endDate: Date,
}
interface BookingInfo {
  _id: any;
  bookingUser: mongoose.Types.ObjectId | UserDocument,
  startDate: Date;
  endDate: Date;
  advert: mongoose.Types.ObjectId | AdvertDocument,
}

export const extractBookingInfo = (booking: BookingDocument) => {
  if ("cabin" in booking.advert
      && "owner" in booking.advert.cabin
      && "firstName" in booking.advert.cabin.owner) {
    return {
      _id: booking._id,
      bookingUser: booking.bookingUser,
      startDate: booking.startDate,
      endDate: booking.endDate,
      ownerOfAdName: `${booking.advert.cabin.owner.firstName} ${booking.advert.cabin.owner.lastName}`,
      advert: booking.advert,
    };
  }
  throw new Error("Unexpected error extracting booking info");
};

export const registerBooking = async (bookingDetails: BookingDetails) => {
  const booking = await Booking.create({
    _id: mongoose.Types.ObjectId(),
    ...bookingDetails,
  });

  if (booking) {
    return booking;
  }

  return false;
};

export const getAllBookings = async () => {
  const bookings = await Booking.find()
    .populate({
      path: "advert",
      populate: {
        path: "cabin",
        populate: {
          path: "owner",
          select: "email firstName lastName -_id",
        },
      },
    })
    .populate({
      path: "bookingUser",
      select: "email firstName lastName -_id",
    });
  if (bookings) {
    const formattedBookings: BookingInfo[] = [];
    bookings.forEach((booking) => {
      if (booking.advert != null) {
        formattedBookings.push(extractBookingInfo(booking));
      }
    });
    return formattedBookings;
  }
  return false;
};

export const getBooking = async (bookingId: string) => {
  const booking = await Booking.findOne({ _id: bookingId })
    .populate({
      path: "advert",
      populate: {
        path: "cabin",
        populate: {
          path: "owner",
          select: "email firstName lastName -_id",
        },
      },
    })
    .populate({
      path: "bookingUser",
      select: "email firstName lastName -_id",
    });
  if (booking) {
    const formattedBooking = extractBookingInfo(booking);
    return formattedBooking;
  }
  throw new HTTP404Error("Advert not found");
};

export const updateBooking = async (idParam: string, body: any) => {
  const result = await Booking.updateOne({ _id: idParam }, { $set: body });
  if (result) {
    const updatedBooking = await Booking.findById(idParam);
    return updatedBooking;
  }
  throw new HTTP400Error();
};

export const deleteBooking = async (idParam: string) => {
  const result = await Booking.findByIdAndDelete(idParam);
  if (result) {
    return {
      _id: idParam,
    };
  }
  throw new HTTP400Error();
};
