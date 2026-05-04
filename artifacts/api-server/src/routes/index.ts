import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oracleRouter from "./oracle";
import legalRouter from "./legal";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import dailyRouter from "./daily";
import accountRouter from "./account";
import referralRouter from "./referral";
import notificationsRouter from "./notifications";
import {
  globalLimiter,
  authLimiter,
  aiGenerationLimiter,
  pushTokenLimiter,
  accountLimiter,
} from "../middleware/rateLimiter";

const router: IRouter = Router();

router.use(globalLimiter);

router.use(healthRouter);
router.use("/send-code", authLimiter);
router.use("/verify-code", authLimiter);
router.use("/apple-signin", authLimiter);
router.use(authRouter);

router.use(profilesRouter);

router.use("/oracle", aiGenerationLimiter);
router.use("/chat", aiGenerationLimiter);
router.use("/synastry", aiGenerationLimiter);
router.use("/deep-dive", aiGenerationLimiter);
router.use("/profile-reading", aiGenerationLimiter);
router.use("/behavioral-profile", aiGenerationLimiter);
router.use("/expand", aiGenerationLimiter);
router.use("/daily-oracle", aiGenerationLimiter);
router.use("/weekly-forecast", aiGenerationLimiter);
router.use(oracleRouter);
router.use(dailyRouter);

router.use(legalRouter);

router.use("/notifications/register", pushTokenLimiter);
router.use("/notifications/unregister", pushTokenLimiter);
router.use(notificationsRouter);

router.use("/account/delete", accountLimiter);
router.use(accountRouter);

router.use(referralRouter);

export default router;
