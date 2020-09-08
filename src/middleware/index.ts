import {
  handleCors,
  handleBodyRequestParsing,
  handleCompression,
  logTraffic,
} from "./common";

export default [
  handleCors,
  handleBodyRequestParsing,
  handleCompression,
  logTraffic,
];
