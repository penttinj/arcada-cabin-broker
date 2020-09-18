/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
import mongoose from "mongoose";
import { CabinDocument } from "../cabins/cabinsModel";

export type AdvertDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId,
  cabin: mongoose.Types.ObjectId | CabinDocument,
  pricePerDay: number,
  startDate: Date,
  endDate: Date,
}

const advertSchema = new mongoose.Schema({
  cabin: {
    type: mongoose.Types.ObjectId,
    ref: "Cabin",
    required: true,
    immutable: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
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

// This is a cool way to validate paths when a document gets updated()
// Though you can't access existing values :/ So one can't check that an updated startDate is
// before the existing endDate
advertSchema.path("startDate").validate(function (v: Date) {
  console.log("onUpdate()");
  console.log("v: ", v);
});

export const Advert = mongoose.model<AdvertDocument>("Advert", advertSchema);
