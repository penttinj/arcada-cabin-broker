import { Sensor } from "./SensorsModel";
import { sensorList } from "./checks";

type UnixTime = number;
export interface DataPoint {
  name: string;
  value: number;
  place: string;
  time: UnixTime;
}
interface IHistoricalDataQuery {
  sensors: string[];
  count: number;
}
interface IPlacesQuery {
  place: string;
  count?: number;
}
type dataQuery = string[] | IHistoricalDataQuery;
type Data = DataPoint[][]; // Is this stupid? :D
type status = "success" | "fail";
interface Response {
  success: boolean;
  message: string;
}
interface SensorGETResponse extends Response {
  intervals: number;
  total: number;
  data: Data;
}
interface SensorPOSTResponse extends Response {
  handledSensors: string[];
}
export interface RawSensorData {
  name: string;
  value: number;
  place: string;
}

export const getData = async (query: dataQuery): Promise<SensorGETResponse> => {
  let result: DataPoint[][] = [];
  if (Array.isArray(query)) {
    result = query[0] === "everything"
      ? await Sensor.findByName(sensorList) // Get a reading from all sensors
      : await Sensor.findByName(query); // Else get the selected sensors in the query
  } else if (typeof query === "object" && (query as IHistoricalDataQuery).count) {
    result = await Sensor.findByName(query.sensors, query.count);
  }

  if (result.length) {
    return {
      success: true,
      intervals: result.length,
      total: result.flat().length,
      message: `Returned ${result.flat().length} individual readings`,
      data: result,
    };
  }
  return {
    success: false,
    intervals: result.length,
    total: result.flat().length,
    message: `Returned: ${result.flat().length} individual readings`,
    data: result,
  };
};

export const parseRequest = async (sensor: string[] | string, c?: string)
  : Promise<string[] | {sensors: string[], count: number}> => {
  const sensors = Array.isArray(sensor) ? sensor : [sensor];

  if (c) {
    const count = parseInt(c, 10);
    return { sensors, count };
    // eslint-disable-next-line no-else-return
  } else {
    return sensors;
  }
};

export const postData = async (rawData: RawSensorData[]): Promise<SensorPOSTResponse> => {
  console.log("In post data");
  const processedData = rawData.map((el) => ({
    ...el,
    time: Math.floor(new Date().getTime() / 1000),
  }));

  const record = await Sensor.create(processedData);
  return { success: true, message: "Sensors were saved!", handledSensors: record.map((e) => e.name) };
};
