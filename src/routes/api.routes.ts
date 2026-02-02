import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { CVController } from "../controllers/CVController";
import { CreditController } from "../controllers/CreditController";
import { ChatController } from "../controllers/ChatController";
import { OnboardingController } from "../controllers/OnboardingController";
import { IdentityController } from "../controllers/IdentityController";
import { StorageController } from "../controllers/StorageController";
import { DailyActionController } from "../controllers/DailyActionController";
import { MilestoneController } from "../controllers/MilestoneController";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Controllers (passing null as they don't have separate services yet, or handling logic internally)
const cvController = new CVController();
const creditController = new CreditController();
const chatController = new ChatController();
const onboardingController = new OnboardingController();
const identityController = new IdentityController();
const storageController = new StorageController();
const dailyActionController = new DailyActionController();
const milestoneController = new MilestoneController();

// CV Routes
router.post("/cv/upload", authenticate, upload.single("file"), (req, res) => storageController.uploadCV(req, res));
router.post("/cv/parse", authenticate, (req, res) => cvController.parseCV(req, res));
router.post("/cv/save-profile", authenticate, (req, res) => onboardingController.saveCvProfile(req, res));

// Credit Routes
router.get("/credit/latest", authenticate, (req, res) => creditController.getLatestAssessment(req, res));
router.post("/credit/calculate", authenticate, (req, res) => creditController.calculateCredit(req, res));

// Chat Routes
router.get("/chat/threads", authenticate, (req, res) => chatController.getThreads(req, res));
router.get("/chat/history/:threadId", authenticate, (req, res) => chatController.getChatHistory(req, res));
router.post("/chat/message", authenticate, (req, res) => chatController.sendMessage(req, res));
router.post("/chat/archive", authenticate, (req, res) => chatController.archiveThread(req, res));
router.post("/chat/unarchive", authenticate, (req, res) => chatController.unarchiveThread(req, res));

// Onboarding Routes
router.get("/onboarding/profile", authenticate, (req, res) => onboardingController.getProfile(req, res));
router.post("/onboarding/save", authenticate, (req, res) => onboardingController.saveOnboarding(req, res));

// Identity Routes
router.post("/id/verify", authenticate, (req, res) => identityController.verifyIdentity(req, res));

// Daily Actions Routes
router.get("/daily-actions", authenticate, (req, res) => dailyActionController.getDailyActions(req, res));
router.patch("/daily-actions/:id/complete", authenticate, (req, res) => dailyActionController.completeDailyAction(req, res));
router.patch("/daily-actions/:id/uncomplete", authenticate, (req, res) => dailyActionController.uncompleteDailyAction(req, res));

// Milestone Routes
router.get("/milestones", authenticate, (req, res) => milestoneController.getMilestones(req, res));
router.get("/milestones/:id", authenticate, (req, res) => milestoneController.getMilestoneDetail(req, res));
router.patch("/milestones/steps/:stepId/complete", authenticate, (req, res) => milestoneController.completeStep(req, res));
router.patch("/milestones/steps/:stepId/uncomplete", authenticate, (req, res) => milestoneController.uncompleteStep(req, res));
router.post("/milestones/:id/submit-review", authenticate, (req, res) => milestoneController.submitReview(req, res));

import { DashboardController } from "../controllers/DashboardController";

const dashboardController = new DashboardController();

// ... existing routes

// Dashboard Routes
router.post("/dashboard/generate", authenticate, (req, res) => dashboardController.generate(req, res));
router.post("/dashboard/generate-weekly", authenticate, (req, res) => dashboardController.generateWeeklyPlan(req, res));

export default router;
