/* eslint-disable no-process-exit */
import http from "http";
import express from "express";
import { PORT } from "./config";
import {
  applyRoutes, logger,
} from "./utils";
import middleware from "./middleware";
import apiRoutes from "./services";
import errorHandlers from "./middleware/errorHandlers";
import { initMongoDB } from "./config/mongodb";

process.on("uncaughtException", (err: Error) => {
  console.log("Uncaught Exception");
  console.log(err);
  logger.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  console.log("Uncaught Rejection");
  console.log(err);
  logger.error(err.stack);
  process.exit(1);
});

async function main() {
  const app = express();
  applyRoutes(middleware, app);
  applyRoutes(apiRoutes, app);
  applyRoutes(errorHandlers, app);

  const httpServer = http.createServer(app);
  await initMongoDB();
  httpServer.listen(PORT, () => console.log(`Server is listening on http://localhost:${PORT}...`));
}
main();
