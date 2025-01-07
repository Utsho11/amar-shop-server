import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";

const app: Application = express();

const corsOptions = {
  origin: [
    "https://amar-shop-client.vercel.app",
    "https://amar-shop-server-one.vercel.app/api",
    "http://localhost:5173",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Amar Shop server is running..",
  });
});

app.use("/api", router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
