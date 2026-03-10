import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "aigc-backend",
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

router.get("/ready", (_req, res) => {
  res.json({
    ready: true,
    upstream: env.UPSTREAM_URL,
    time: new Date().toISOString(),
  });
});

export default router;
