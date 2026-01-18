import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { CVController } from "../controllers/CVController";
import { CreditController } from "../controllers/CreditController";
import { ChatController } from "../controllers/ChatController";
import { OnboardingController } from "../controllers/OnboardingController";
import { IdentityController } from "../controllers/IdentityController";
import { StorageController } from "../controllers/StorageController";
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

// CV Routes
router.post("/cv/upload", authenticate, upload.single("file"), (req, res) => storageController.uploadCV(req, res));
router.post("/cv/parse", authenticate, (req, res) => cvController.parseCV(req, res));
router.post("/cv/save-profile", authenticate, (req, res) => onboardingController.saveCvProfile(req, res));

// Credit Routes
router.get("/credit/latest", authenticate, (req, res) => creditController.getLatestAssessment(req, res));
router.post("/credit/calculate", authenticate, (req, res) => creditController.calculateCredit(req, res));

// Chat Routes
router.post("/chat/thread", authenticate, (req, res) => chatController.createThread(req, res));
router.get("/chat/threads", authenticate, (req, res) => chatController.getThreads(req, res));
router.get("/chat/history/:threadId", authenticate, (req, res) => chatController.getChatHistory(req, res));
router.post("/chat/message", authenticate, (req, res) => chatController.sendMessage(req, res));

// Onboarding Routes
router.get("/onboarding/profile", authenticate, (req, res) => onboardingController.getProfile(req, res));
router.post("/onboarding/save", authenticate, (req, res) => onboardingController.saveOnboarding(req, res));

// Identity Routes
router.post("/id/verify", authenticate, (req, res) => identityController.verifyIdentity(req, res));

import { DashboardController } from "../controllers/DashboardController";

const dashboardController = new DashboardController();

// ... existing routes

// Dashboard Routes
router.post("/dashboard/generate", authenticate, (req, res) => dashboardController.generate(req, res));
router.post("/dashboard/generate-weekly", authenticate, (req, res) => dashboardController.generateWeeklyPlan(req, res));

export default router;
