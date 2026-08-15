import express, { Application } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import prisma from "./shared/prisma";

const app: Application = express();

const allowedOrigins = [
  "https://amar-shop-client.vercel.app",
  "https://amar-shop-server-gules.vercel.app",
  "https://sandbox.sslcommerz.com",
  "https://securepay.sslcommerz.com"
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.includes("sslcommerz.com") ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
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




app.use(notFound);
app.use(globalErrorHandler);

export default app;
