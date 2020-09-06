import { Request, Response, NextFunction } from "express";
import { body, check, query } from "express-validator";
import { queryCheck, bodyCheck } from "./checks";
import { authenticate } from "../../middleware/authenticate";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import * as SensorsService from "./SensorsService";
import { logger } from "../../utils";
import { HTTP400Error } from "../../utils/httpErrors";

export default [
  {
    path: "/api/sensors",
    method: "get",
    handler: [
      authenticate,
      query("sensor.*")
        .optional()
        .trim()
        .escape(),
      query("count")
        .optional()
        .trim()
        .isNumeric()
        .toInt()
        .escape(),
      handleValidatorResult,
      queryCheck,
      async (req: Request, res: Response, next: NextFunction) => {
        console.log("GET /api/sensors queries:", req.query);
        const { sensor, count } = req.query;
        const parsedQuery = sensor === undefined
          ? ["everything"]
          : await SensorsService.parseRequest(
          sensor as string[] | string, count as string,
          );

        const timeStart = Date.now();

        const data = await SensorsService.getData(parsedQuery)
          .catch((e) => next(e));

        const timeEnd = Date.now();
        const timeElapsed = timeEnd - timeStart;
        console.log("Time elapsed:", timeElapsed);

        res.status(200).json(data);
        res.end();
      },
    ],
  },
  {
    path: "/api/sensors",
    method: "post",
    handler: [
      authenticate,
      body(["data.*.name", "data.*.value", "data.*.place"])
        .exists()
        .trim()
        .escape(),
      body("data.*.value")
        .isNumeric(),
      handleValidatorResult,
      bodyCheck,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = await SensorsService.postData(req.body.data)
          .catch((e) => next(e));
        res.status(200).json(result);
        res.end();
      },
    ],
  },
  {
    path: "/api/sensors/guest",
    method: "get",
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        // An unauthorized user is allowed to get the latest data of all sensors
        console.log("GET /api/sensors/guest");
        const timeStart = Date.now();

        const data = await SensorsService.getData(["everything"])
          .catch((e) => next(e));

        const timeEnd = Date.now();
        const timeElapsed = timeEnd - timeStart;
        console.log("Time elapsed:", timeElapsed);

        res.status(200).json(data);
        res.end();
      },
    ],
  },
  {
    path: "/api/sensors",
    method: "options",
    handler: [
      authenticate,
      async (req: Request, res: Response) => {
        console.log("OPTIONS!!");
        res.set({
          Allow: "GET, POST",
          "Cache-Control": "No-Store",
        });
        res.end();
      },
    ],
  },
];
