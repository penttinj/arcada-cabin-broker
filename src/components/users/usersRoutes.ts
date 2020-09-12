import {
  Router, Request, Response, NextFunction,
} from "express";
import { check, param, body } from "express-validator";
import * as usersController from "./usersController";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authorization";
import { isSameUser } from "../../utils";
import {
  HTTP400Error, HTTP401Error, HTTP404Error, HTTP403Error,
} from "../../utils/httpErrors";

export default (app: Router) => {
  const route = Router();
  app.use("/users", route);

  route.post("/register",
    check("email").exists().isEmail(),
    check(["firstName", "lastName", "password"]).exists().trim().escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersController.createUser({
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
    check(["email", "password"]).exists().escape(),
    check("email").isEmail(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      console.log(req.body);

      try {
        const result = await usersController.login(req.body.email, req.body.password);
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
    check("id").exists().escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sameUser = await isSameUser(
          req.headers.authorization as string,
          req.params.id,
        );
        if (sameUser) {
          const result = await usersController.getUser(req.params.id);
          res.status(200).json(result);
        } else {
          throw new HTTP403Error();
        }
      } catch (e) {
        next(e);
      }
    });
  route.put("/:id",
    authenticate,
    param("id").exists().escape(),
    body("email").optional().isEmail(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      // _id is immutable so no need to prevent _id from body! :D
      try {
        const sameUser = await isSameUser(
        req.headers.authorization as string,
        req.params.id,
        );
        if (sameUser) {
          const result = await usersController.updateUser(req.params.id, req.body);
          res.status(200).json(result);
        } else {
          throw new HTTP403Error();
        }
      } catch (e) {
        next(e);
      }
    });
  route.delete("/:id",
    authenticate,
    param("id").exists().escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sameUser = await isSameUser(
        req.headers.authorization as string,
        req.params.id,
        );
        if (sameUser) {
          const result = await usersController.deleteUser(req.params.id);
          res.status(200).json(result);
        } else {
          throw new HTTP403Error();
        }
      } catch (e) {
        next(e);
      }
    });
};
