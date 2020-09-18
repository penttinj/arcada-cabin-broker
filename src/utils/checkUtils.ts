import mongoose, { Types } from "mongoose";
import { HTTP404Error } from "./httpErrors";

type DocumentWithDates = mongoose.Document & {
  startDate: Date,
  endDate: Date,
}

/**
 * @param model A model that contains startDate and endDate
 * @param id The document Id
 * @returns Array, in the shape of [startDate, endDate]
 */
export const getDatesAsUnixFromModel = async (
  model: mongoose.Model<DocumentWithDates>, id: string | Types.ObjectId,
) => {
  const result = await model.findById(id);
  if (result) {
    return [
      result.startDate.getTime(),
      result.endDate.getTime(),
    ];
  }
  throw new HTTP404Error();
};

export const convertDocumentDatesToUnix = (doc: DocumentWithDates) => {
  return [
    doc.startDate.getTime(),
    doc.endDate.getTime(),
  ];
};

export type Options = "within" | "collision";

export const checkDocDates = (
  incomingStartD: number,
  incomingEndD: number,
  modelStartD: number,
  modelEndD: number,
  within: Options,
) => {
  switch (within) {
    case "within":
      if ((incomingStartD >= modelStartD && incomingStartD <= modelEndD)
        && (incomingEndD <= modelEndD && incomingEndD >= modelStartD)) {
        return true;
      }
      return false;
    case "collision":
      if (
        (incomingStartD >= modelStartD && incomingStartD <= modelEndD)
        || (incomingEndD <= modelEndD && incomingEndD >= modelStartD)
        || (incomingStartD <= modelStartD && incomingEndD >= modelStartD)
        || (incomingEndD >= modelEndD && incomingStartD <= modelEndD)
      ) {
        return true;
      }
      return false;
    default:
      throw new Error("Invalid parameter for 'within'");
  }
};
