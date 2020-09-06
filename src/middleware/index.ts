import {
  handleCors,
  handleBodyRequestParsing,
  handleCompression,
  trafficLog,
} from "./common";

export default [
  handleCors,
  handleBodyRequestParsing,
  handleCompression,
  trafficLog,
];
