import {
  Router, Request, Response, NextFunction,
} from "express";
import { check, param, body } from "express-validator";
import * as usersService from "./usersService";
import { handleValidatorResult } from "../../middleware/handleValidatorResult";
import { authenticate } from "../../middleware/authentication";
import { isSameUser } from "./checks";

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
    check(["email", "password"]).exists().escape(),
    check("email").isEmail(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
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

  // Only the logged in user itself is allowed to see its own information.
  route.get("/:id",
    authenticate,
    isSameUser,
    param("id").escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersService.getUser(req.params.id);
        res.status(200).json({
          success: true,
          message: "Found the user",
          user: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.put("/:id",
    authenticate,
    isSameUser,
    param("id").escape(),
    body("email").optional().isEmail(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      // _id is immutable so no need to prevent _id from body! :D
      try {
        const result = await usersService.updateUser(req.params.id, req.body);
        res.status(200).json({
          success: true,
          message: "Updated user",
          user: result,
        });
      } catch (e) {
        next(e);
      }
    });

  route.delete("/:id",
    authenticate,
    isSameUser,
    param("id").exists().escape(),
    handleValidatorResult,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersService.deleteUser(req.params.id);
        res.status(200).json({
          success: true,
          message: "Deleted user",
          user: result,
        });
      } catch (e) {
        next(e);
      }
    });
};
