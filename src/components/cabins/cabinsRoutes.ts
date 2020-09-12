import {
  Router, Request, Response, NextFunction,
} from "express";

export default (app: Router) => {
  const route = Router();
  app.use("/cottages", route);

  route.post("/",
    async (req: Request, res: Response, next: NextFunction) => {

    });
  route.get("/",
    async (req: Request, res: Response, next: NextFunction) => {

    });
  route.get("/:id",
    async (req: Request, res: Response, next: NextFunction) => {

    });
  route.put("/:id",
    async (req: Request, res: Response, next: NextFunction) => {

    });
  route.delete("/:id",
    async (req: Request, res: Response, next: NextFunction) => {

    });
};
