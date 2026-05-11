import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import prisma from "./shared/prisma";
import * as cron from 'node-cron'
const app: Application = express();

const allowedOrigins = [
  "https://amar-shop-client.vercel.app",
  "https://amar-shop-server-gules.vercel.app",
  "https://sandbox.sslcommerz.com",
  "http://localhost:5173",
];

const corsOptions = {
  origin(origin: string | undefined, callback: any) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send({ message: "Amar Shop server is running.." });
});

app.use("/api", router);

cron.schedule("* 4 * * * *", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    console.log("Neon DB pinged");
  } catch (error) {
    console.error(error);
  }
});


app.use(notFound);
app.use(globalErrorHandler);

export default app;
