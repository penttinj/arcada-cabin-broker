/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
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
interface CabinInfo {
    _id: any;
    owner: string;
    address: string;
    squarageProperty: number;
    squarageCabin: number;
    sauna: boolean;
    beachfront: boolean;
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
  throw new Error("Unexpected error in extractcabininfo");
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
  const cabins = await Cabin.find().populate("owner").exec();
  if (cabins) {
    const formattedCabins: CabinInfo[] = [];
    cabins.forEach((cabin) => {
      if (cabin.owner != null) {
        formattedCabins.push(extractCabinInfo(cabin));
      }
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

export const updateCabin = async (idParam: string, body: any) => {
  const result = await Cabin.updateOne({ _id: idParam }, { $set: body });
  if (result) {
    const updatedCabin = await Cabin.findById(idParam).populate("owner");
    return extractCabinInfo(updatedCabin as CabinDocument);
  }
  throw new HTTP400Error();
};

export const deleteCabin = async (idParam: string) => {
  const result = await Cabin.findByIdAndDelete(idParam);
  if (result) {
    return {
      _id: idParam,
    };
  }
  throw new HTTP400Error();
};
