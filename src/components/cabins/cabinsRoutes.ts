import {
  Router, Request, Response, NextFunction,
} from "express";
import { check, param, body } from "express-validator";
import * as cabinsService from "./cabinsService";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authentication";
import { isSameUser } from "./checks";
import { getIdFromToken } from "../../utils";

export default (app: Router) => {
  const route = Router();
  app.use("/cabins", route);

  // Register cabin
  route.post("/",
    authenticate,
    body(["address", "squarageProperty", "squarageCabin", "sauna", "beachfront"])
      .exists().trim().escape(),
    body(["squarageProperty", "squarageCabin"]).isNumeric(),
    body(["sauna", "beachfront"]).isBoolean(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = getIdFromToken(req.headers.authorization as string);
        const result = await cabinsService.registerCabin({
          userId,
          address: req.body.address,
          squarageProperty: req.body.squarageProperty,
          squarageCabin: req.body.squarageCabin,
          sauna: req.body.sauna,
          beachfront: req.body.beachfront,
        });

        if (result) {
          res.status(201).json({
            success: true,
            message: "Cabin created",
            cabin: result,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "User couldn't be created",
          });
        }
      } catch (e) {
        next(e);
      }
    });

  route.get("/",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await cabinsService.getAllCabins();
        if (result) {
          res.status(200).json({
            success: true,
            message: `${result.length} Cabins found`,
            cabins: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No cabins were found",
          });
        }
      } catch (e) {
        next(e);
      }
    });

  route.get("/:cabinId",
    authenticate,
    param("cabinId").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await cabinsService.getCabin(req.params.cabinId);
        res.status(200).json({
          success: true,
          message: "Cabin found",
          cabin: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.put("/:cabinId",
    authenticate,
    isSameUser,
    param("cabinId").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await cabinsService.updateCabin(req.params.cabinId, req.body);
        res.status(200).json({
          success: true,
          message: "Updated cabin",
          cabin: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.delete("/:cabinId",
    authenticate,
    isSameUser,
    param("cabinId").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await cabinsService.deleteCabin(req.params.cabinId);
        res.status(200).json({
          success: true,
          message: "Deleted cabin",
          cabin: result,
        });
      } catch (e) {
        next(e);
      }
    });
};
