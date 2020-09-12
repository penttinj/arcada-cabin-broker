import {
  Router, Request, Response, NextFunction,
} from "express";
import { check } from "express-validator";
import * as usersService from "./usersController";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authorization";
import { isSameUser } from "../../utils";
import { User } from "./usersModel";
import { HTTP400Error, HTTP401Error, HTTP404Error } from "../../utils/httpErrors";

export default (app: Router) => {
  const route = Router();
  app.use("/users", route);

  route.post("/register",
    check("email").exists().isEmail(),
    check(["firstName", "lastName", "password"]).exists().trim().escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersService.createUser({
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: req.body.password,
        });

        if (result) {
          res.status(201).json({
            success: true,
            message: "User created",
            user: result,
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
  route.post("/login",
    check(["email", "password"]).exists(),
    check("email").isEmail(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      console.log(req.body);

      try {
        const result = await usersService.login(req.body.email, req.body.password);
        res.set("Authorization", result.token);
        res.status(200).json({
          success: true,
          message: "Login successful",
          ...result,
        });
      } catch (e) {
        next(e);
      }
    });
  route.get("/:id",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersService.getUser(
          req.headers.authorization as string,
          req.params.id,
        );
        res.status(200).json(result);
      } catch (e) {
        next(e);
      }
    });
  route.put("/:id",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      const sameUser = await isSameUser(
        req.headers.authorization as string,
        req.params.id,
      );
      usersService.updateUser();
    });
  route.delete("/:id",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      const sameUser = await isSameUser(
        req.headers.authorization as string,
        req.params.id,
      );
    });
};
