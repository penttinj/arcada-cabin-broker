import mongoose from "mongoose";
import {
  HTTP400Error,
  HTTP401Error,
  HTTP404Error,
} from "../../utils/httpErrors";
import { UserDocument } from "../users/usersModel";
import { Cabin, CabinDocument } from "./cabinsModel";

interface CabinDetails {
  userId: string,
  address: string,
  squarageProperty: number,
  squarageCabin: number,
  sauna: boolean,
  beachfront: boolean,
}

export const extractCabinInfo = (cabin: CabinDocument) => {
  if ("firstName" in cabin.owner) {
    return {
      _id: cabin._id,
      owner: `${cabin.owner.firstName} ${cabin.owner.lastName}`,
      address: cabin.address,
      squarageProperty: cabin.squarageProperty,
      squarageCabin: cabin.squarageCabin,
      sauna: cabin.sauna,
      beachfront: cabin.beachfront,
    };
  }
  throw new Error("Something happened extracting cabin info");
};

export const registerCabin = async (cabinDetails: CabinDetails) => {
  const cabin = await Cabin.create({
    _id: mongoose.Types.ObjectId(),
    owner: cabinDetails.userId,
    ...cabinDetails,
  });
  if (cabin) {
    return cabin;
  }

  return false;
};

export const getAllCabins = async () => {
  const cabins = await Cabin.find().populate("owner");
  if (cabins && "firstName" in cabins[0].owner) {
    const formattedCabins = cabins.map((cabin) => {
      return extractCabinInfo(cabin);
    });
    return formattedCabins;
  }
  return false;
};

export const getCabin = async (cabinId: string) => {
  const cabin = await Cabin.findOne({ _id: cabinId }).populate("owner");
  if (cabin) {
    const formattedCabin = extractCabinInfo(cabin);
    return formattedCabin;
  }
  throw new HTTP404Error("Cabin not found");
};

/*
export const updateUser = async (idParam: string, body: any) => {
  if (body.email) await isUniqueEmail(body.email);
  const result = await User.updateOne({ _id: idParam }, { $set: body });
  if (result) {
    const updatedUser = await User.findById(idParam);
    return {
      success: true,
      message: "Updated user",
      user: extractUserInfo(updatedUser as UserDocument),
    };
  }
  throw new HTTP400Error();
};

export const deleteUser = async (idParam: string) => {
  const result = await User.findByIdAndDelete({ _id: idParam });
  if (result) {
    return {
      success: true,
      message: "Deleted user",
    };
  }
  throw new HTTP400Error();
};
*/
