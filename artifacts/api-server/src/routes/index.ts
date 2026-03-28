import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oracleRouter from "./oracle";
import legalRouter from "./legal";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import dailyRouter from "./daily";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(oracleRouter);
router.use(legalRouter);
router.use(dailyRouter);

export default router;
