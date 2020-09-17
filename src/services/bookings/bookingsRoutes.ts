import {
  Router, Request, Response, NextFunction,
} from "express";
import { check, param, body } from "express-validator";
import * as bookingsService from "./bookingsService";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authentication";
import {
  advertExists, isSameUser, checkDates, checkUpdatedDates,
} from "./checks";
import { getIdFromToken } from "../../utils";

export default (app: Router) => {
  const route = Router();
  app.use("/bookings", route);

  // Register booking
  route.post("/",
    authenticate,
    body(["advertId", "startDate", "endDate"])
      .exists().trim().escape(),
    body(["startDate", "endDate"]).isISO8601(),
    handleValidatorResult,
    advertExists,
    checkDates,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await bookingsService.registerBooking({
          advert: req.body.advertId,
          bookingUser: getIdFromToken(req.headers.authorization as string),
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        });

        if (result) {
          res.status(201).json({
            success: true,
            message: "Booking created",
            advert: result,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Booking couldn't be created for internal reasons",
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
        const result = await bookingsService.getAllBookings();
        if (result) {
          res.status(200).json({
            success: true,
            message: `${result.length} bookings found`,
            bookings: result,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "No bookings were found",
          });
        }
      } catch (e) {
        next(e);
      }
    });

  route.get("/:bookingId",
    authenticate,
    param("bookingId").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await bookingsService.getBooking(req.params.bookingId);
        res.status(200).json({
          success: true,
          message: "Booking found",
          booking: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.put("/:bookingId",
    authenticate,
    body(["startDate", "endDate"]).optional().isISO8601(),
    param("bookingId").escape(),
    handleValidatorResult,
    isSameUser,
    checkUpdatedDates,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await bookingsService.updateBooking(req.params.bookingId, req.body);
        res.status(200).json({
          success: true,
          message: "Updated booking",
          booking: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.delete("/:bookingId",
    authenticate,
    param("bookingId").escape(),
    handleValidatorResult,
    isSameUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await bookingsService.deleteBooking(req.params.bookingId);
        res.status(200).json({
          success: true,
          message: "Deleted cabin",
          advert: result,
        });
      } catch (e) {
        next(e);
      }
    });
};
