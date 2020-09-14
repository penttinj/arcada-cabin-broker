/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
import mongoose from "mongoose";
import {
  HTTP400Error,
  HTTP401Error,
  HTTP404Error,
} from "../../utils/httpErrors";
import { UserDocument } from "../users/usersModel";
import { Advert, AdvertDocument } from "./advertsModel";

interface AdvertDetails {
  cabin: string,
  pricePerDay: number,
  startDate: Date,
  endDate: Date,
}
interface AdvertInfo {
    _id: any;
    pricePerDay: number;
    address: string;
    startDate: Date;
    endDate: Date;
}

export const extractAdvertInfo = (advert: AdvertDocument) => {
  if ("owner" in advert.cabin) {
    return {
      _id: advert._id,
      pricePerDay: advert.pricePerDay,
      address: advert.cabin.address,
      startDate: advert.startDate,
      endDate: advert.endDate,
      cabin: advert.cabin,
    };
  }
  throw new Error("Unexpected error extracting advert info");
};

export const registerAdvert = async (advertDetails: AdvertDetails) => {
  console.log("advertDetails:", advertDetails);
  const advert = await Advert.create({
    _id: mongoose.Types.ObjectId(),
    ...advertDetails,
  });

  if (advert) {
    return advert;
  }

  return false;
};

export const getAllAdverts = async () => {
  const adverts = await Advert.find()
    .populate({
      path: "cabin",
      populate: {
        path: "owner",
        select: "-password",
      },
    });
  if (adverts) {
    const formattedAdverts: AdvertInfo[] = [];
    adverts.forEach((ad) => {
      if (ad.cabin != null) {
        formattedAdverts.push(extractAdvertInfo(ad));
      }
    });
    return formattedAdverts;
  }
  return false;
};

export const getAdvert = async (advertId: string) => {
  const advert = await Advert.findOne({ _id: advertId })
    .populate({
      path: "cabin",
      populate: {
        path: "owner",
        select: "-password",
      },
    });
  if (advert) {
    const formattedCabin = extractAdvertInfo(advert);
    return formattedCabin;
  }
  throw new HTTP404Error("Advert not found");
};

export const updateAdvert = async (idParam: string, body: any) => {
  const result = await Advert.updateOne({ _id: idParam }, { $set: body }, { runValidators: true });
  if (result) {
    const updatedAdvert = await Advert.findById(idParam).populate("cabin");
    return extractAdvertInfo(updatedAdvert as AdvertDocument);
  }
  throw new HTTP400Error();
};

export const deleteAdvert = async (idParam: string) => {
  const result = await Advert.findByIdAndDelete(idParam);
  if (result) {
    return {
      _id: idParam,
    };
  }
  throw new HTTP400Error();
};
