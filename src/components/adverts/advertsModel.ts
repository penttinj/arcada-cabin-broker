import mongoose from "mongoose";
import { UserDocument } from "../users/usersModel";

export type CabinDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId,
  owner: mongoose.Types.ObjectId | UserDocument,
  address: string,
  squarageProperty: number,
  squarageCabin: number,
  sauna: boolean,
  beachfront: boolean,
}

const cabinSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  address: {
    type: String,
    required: true,
  },
  squarageProperty: {
    type: Number,
    required: true,
  },
  squarageCabin: {
    type: Number,
    required: true,
  },
  sauna: {
    type: Boolean,
    required: true,
  },
  beachfront: {
    type: Boolean,
    required: true,
  },
}, { timestamps: true });

export const Cabin = mongoose.model<CabinDocument>("Cabin", cabinSchema);
