import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello, User!" });
});

// router.post("/create-user",)

export const UserRoutes = router;
