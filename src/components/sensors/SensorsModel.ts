/* eslint-disable arrow-body-style */
/* eslint-disable no-restricted-syntax */
import mongoose, { Query } from "mongoose";
import { DataPoint } from "./SensorsService";
import { HTTP404Error, HTTP400Error } from "../../utils/httpErrors";

export type SensorDocument = mongoose.Document & {
  name: string,
  value: number,
  place: string,
  time: number,

  // findAllByPlace(): string[], <-- This would be here if it was a method, not static
}

export type SensorModel = mongoose.Model<SensorDocument> & {
  /**
   * Return all sensors that reside in the specified place.
   * @param place Somewhere like inside or outside
   */
  findByPlace(place: string): Promise<DataPoint[]>,
  /**
   * Return sensors with the matched name.
   * Accepts string of one sensor or array of sensor names.
   * @param names Sensor name or array of names.
   */
  findByName(names: string[], count?: number): Promise<DataPoint[][]>
}

const sensorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
  },
  value: {
    type: Number,
    required: true,
  },
  place: {
    type: String,
    required: true,
    lowercase: true,
  },
  time: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

sensorSchema.statics.findByPlace = async function findByPlace(
  place: string,
): Promise<DataPoint[]> {
  return this.find({ place }, (err: Error, docs: SensorDocument[]) => docs);
};

sensorSchema.statics.findByName = async function findByName(
  sensorNames: string[], limit = 1,
): Promise<DataPoint[][]> {
  const dataIntervals: DataPoint[][] | PromiseLike<DataPoint[][]> = [];

  const promises = sensorNames.map(async (sensorName) => {
    return this.find({ name: sensorName })
      .limit(limit)
      .sort({ time: "desc" })
      .then((docs: SensorDocument[]) => {
        if (docs.length === undefined) {
          throw new HTTP404Error(`Sensor wasn't found (yet) in database: ${sensorName}`);
        }

        docs.map(async (doc, i) => {
          const {
            name, value, place, time,
          } = doc;
          // Fill the index with an empty array to allow .push() method to work
          if (!dataIntervals[i]) dataIntervals[i] = [];
          dataIntervals[i].push({
            name,
            value,
            place,
            time,
          });
        });
      });
  });

  await Promise.all(promises);

  return dataIntervals;
};

export const Sensor = mongoose.model<SensorDocument, SensorModel>("Sensor", sensorSchema);
