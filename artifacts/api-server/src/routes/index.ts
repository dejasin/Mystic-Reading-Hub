import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oracleRouter from "./oracle";

const router: IRouter = Router();

router.use(healthRouter);
router.use(oracleRouter);

export default router;
