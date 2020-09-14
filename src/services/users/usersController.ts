/* eslint-disable no-else-return */
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import {
  HTTP400Error,
  HTTP401Error,
  HTTP404Error,
} from "../../utils/httpErrors";
import { User, UserDocument } from "./usersModel";
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

export const extractUserInfo = (user: UserDocument) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});

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
    return extractUserInfo(user);
  } else {
    return false;
  }
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    console.log("correct password & user");
    const payload = {
      _id: user.id,
      email: user.email,
    };
    const token = generateToken(payload);
    return {
      user: extractUserInfo(user),
      token,
    };
  } else {
    throw new HTTP400Error("Incorrect email or password");
  }
};

export const getUser = async (idParam: string) => {
  const result = await User.findById(idParam);
  if (result) {
    return extractUserInfo(result);
  } else {
    throw new HTTP404Error();
  }
};

export const updateUser = async (idParam: string, body: any) => {
  if (body.email) await isUniqueEmail(body.email);
  const result = await User.updateOne({ _id: idParam }, { $set: body });
  if (result) {
    const updatedUser = await User.findById(idParam);
    return extractUserInfo(updatedUser as UserDocument);
  } else {
    throw new HTTP400Error();
  }
};

export const deleteUser = async (idParam: string) => {
  const result = await User.findByIdAndDelete({ _id: idParam });
  if (result) {
    return {
      _id: idParam,
    };
  } else {
    throw new HTTP400Error();
  }
};
