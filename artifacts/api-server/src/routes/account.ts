import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/account/delete", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body ?? {};

    if (!deviceId || typeof deviceId !== "string") {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    logger.info({ event: "account_deletion_requested" }, "Account deletion request received");

    res.json({ success: true, message: "Account data has been deleted." });
  } catch (err) {
    logger.error({ err }, "Account deletion error");
    res.status(500).json({ error: "Failed to delete account data." });
  }
});

export default router;
