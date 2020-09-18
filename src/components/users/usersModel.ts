import mongoose from "mongoose";

export type UserDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export const User = mongoose.model<UserDocument>("User", userSchema);
