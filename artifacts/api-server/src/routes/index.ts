import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import programsRouter from "./programs";
import sessionsRouter from "./sessions";
import quotasRouter from "./quotas";
import applicationsRouter from "./applications";
import challansRouter from "./challans";
import documentsRouter from "./documents";
import meritListsRouter from "./meritLists";
import verificationsRouter from "./verifications";
import noticesRouter from "./notices";
import auditLogsRouter from "./auditLogs";
import dashboardRouter from "./dashboard";
import joinedStudentsRouter from "./joinedStudents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(programsRouter);
router.use(sessionsRouter);
router.use(quotasRouter);
router.use(applicationsRouter);
router.use(challansRouter);
router.use(documentsRouter);
router.use(meritListsRouter);
router.use(verificationsRouter);
router.use(noticesRouter);
router.use(auditLogsRouter);
router.use(dashboardRouter);
router.use(joinedStudentsRouter);

export default router;
