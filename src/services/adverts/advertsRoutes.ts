import {
  Router, Request, Response, NextFunction,
} from "express";
import { check, param, body } from "express-validator";
import * as advertsService from "./advertsService";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authentication";
import { isSameCabinOwner, checkDates, checkUpdatedDates } from "./checks";
import { getIdFromToken } from "../../utils";
import { HTTP403Error } from "../../utils/httpErrors";

export default (app: Router) => {
  const route = Router();
  app.use("/adverts", route);

  // Register advert
  route.post("/",
    authenticate,
    body(["cabinId", "pricePerDay", "startDate", "endDate"])
      .exists().trim().escape(),
    body("pricePerDay").isNumeric(),
    body(["startDate", "endDate"]).isISO8601(),
    handleValidatorResult,
    isSameCabinOwner,
    checkDates,
    // Could still also check an advert doesn't collide with other ads for same cabin
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // I guess we could pass the start and end dates to the service
        // and from there it checks for collisions. Since we're hving to access the Model
        const result = await advertsService.registerAdvert({
          cabin: req.body.cabinId,
          pricePerDay: req.body.pricePerDay,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        });

        if (result) {
          res.status(201).json({
            success: true,
            message: "Advert created",
            advert: result,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Advert couldn't be created",
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
        const result = await advertsService.getAllAdverts();
        if (result) {
          res.status(200).json({
            success: true,
            message: `${result.length} Adverts found`,
            adverts: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No adverts were found",
          });
        }
      } catch (e) {
        next(e);
      }
    });

  route.get("/:advertId",
    authenticate,
    param("advertId").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await advertsService.getAdvert(req.params.advertId);
        res.status(200).json({
          success: true,
          message: "Advert found",
          advert: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.put("/:advertId",
    authenticate,
    body(["startDate", "endDate"]).optional().isISO8601(),
    param("advertId").escape(),
    handleValidatorResult,
    isSameCabinOwner,
    checkDates,
    checkUpdatedDates,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await advertsService.updateAdvert(req.params.advertId, req.body);
        res.status(200).json({
          success: true,
          message: "Updated advert",
          advert: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.delete("/:advertId",
    authenticate,
    param("advertId").escape(),
    isSameCabinOwner,
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await advertsService.deleteAdvert(req.params.advertId);
        res.status(200).json({
          success: true,
          message: "Deleted advert",
          advert: result,
        });
      } catch (e) {
        next(e);
      }
    });
};
