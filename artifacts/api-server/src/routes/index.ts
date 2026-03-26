import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oracleRouter from "./oracle";
import legalRouter from "./legal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(oracleRouter);
router.use(legalRouter);

export default router;
