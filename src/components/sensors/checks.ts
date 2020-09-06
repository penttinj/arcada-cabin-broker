/* eslint-disable no-restricted-syntax */
import {
  Request, Response, NextFunction,
} from "express";
import { logger, emptyQuery } from "../../utils";
import { HTTP400Error } from "../../utils/httpErrors";
import { RawSensorData } from "./SensorsService";

// This list could become an .env var or some json file.
export const sensorList = [
  "inside_temperature",
  "inside_humidity",
  "outside_temperature",
  "outside_humidity",
  "co2",
  "fakesensor",
];

export const placesList = {

};

const MAX_QUERY_LENGTH = sensorList.length + 1;

const mustInclude = (query: string | string[], compareList: string[]): boolean => {
  if (typeof query === "string") return compareList.includes(query.toLocaleLowerCase());
  for (const val of query) {
    if (!compareList.includes(val.toLocaleLowerCase())) {
      console.log("compareList does not include ", val);
      return false;
    }
  }
  return true;
};

const isUniqueArrayItems = (list: string[]): boolean => {
  console.log("the list:", list);
  return list.length === new Set(list).size;
};

export const queryCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.sensor) {
    if (Object.keys(req.query).length > MAX_QUERY_LENGTH) {
      throw new HTTP400Error("Too many parameters");
    } else if (!mustInclude(req.query.sensor as string | string[], sensorList)) {
      throw new HTTP400Error("Sensors query contains illegal elements");
    } else if (typeof req.query.sensor !== "string") {
      if (!isUniqueArrayItems(req.query.sensor as string[])) {
        throw new HTTP400Error("The sensors query contains duplicate names");
      }
    }
  }

  next();
};

export const bodyCheck = (req: Request, res: Response, next: NextFunction) => {
  if (!mustInclude(
    req.body.data.map((el: RawSensorData) => el.name.toLocaleLowerCase()),
    sensorList,
  )) {
    throw new HTTP400Error("The sensors list contains illegal elements");
  }
  if (!isUniqueArrayItems(req.body.data.map((el: RawSensorData) => el.name.toLocaleLowerCase()))) {
    throw new HTTP400Error("The sensors list contains duplicate names");
  } else {
    next();
  }
};
