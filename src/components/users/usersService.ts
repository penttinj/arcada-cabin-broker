/* eslint-disable no-else-return */
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { HTTP400Error } from "../../utils/httpErrors";
import { User } from "./usersModel";
import { generateToken } from "../../utils";

interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

const validatePasswordLength = (password: string, min: number) => {
  if (password.length < min) {
    throw new HTTP400Error(`Password too short! Minimum length is ${min}`);
  }
};

const isUniqueEmail = async (email: string) => {
  const result = await User.findOne({ email }).exec();
  if (result) {
    console.log(result);
    throw new HTTP400Error(`Email already exists!`);
  }
};

export const createUser = async (userDetails: UserDetails) => {
  validatePasswordLength(userDetails.password, 8);
  await isUniqueEmail(userDetails.email);
  const hashedPassword = await bcrypt.hash(userDetails.password, 10);
  const user = await User.create({
    _id: mongoose.Types.ObjectId(),
    ...userDetails,
    password: hashedPassword,
  });
  if (user) {
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } else {
    return false;
  }
};

export const login = async (email: string, password: string) => {
  console.log("");
  const user = await User.findOne({ email });
  if (user && bcrypt.compare(password, user.password)) {
    console.log("correct password & user");
    const payload = {
      _id: user.id,
      email: user.email,
    };
    const token = generateToken(payload);
    return {
      user: {
        _id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  } else {
    throw new HTTP400Error("Incorrect user or email");
  }
};
