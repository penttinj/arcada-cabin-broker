/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
import mongoose from "mongoose";
import { AdvertDocument } from "../adverts/advertsModel";
import { UserDocument } from "../users/usersModel";

export type BookingDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId,
  advert: mongoose.Types.ObjectId | AdvertDocument,
  bookingUser: mongoose.Types.ObjectId | UserDocument,
  startDate: Date,
  endDate: Date,
}

const bookingSchema = new mongoose.Schema({
  advert: {
    type: mongoose.Types.ObjectId,
    ref: "Advert",
    required: true,
    immutable: true,
  },
  bookingUser: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

export const Booking = mongoose.model<BookingDocument>("Booking", bookingSchema);
