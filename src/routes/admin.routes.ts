import { Router } from "express";
import { authenticateAdmin, requireMasterAdmin } from "../admin/middlewares/admin.middleware";
import { AdminAuthController } from "../admin/controllers/AdminAuthController";
import { AdminManagementController } from "../admin/controllers/AdminManagementController";
import { AdminUserController } from "../admin/controllers/AdminUserController";
import { AdminTaskController } from "../admin/controllers/AdminTaskController";
import { AdminDashboardController } from "../admin/controllers/AdminDashboardController";
import { AdminAtRiskController } from "../admin/controllers/AdminAtRiskController";

const router = Router();

// ==========================================
// Auth Routes (No auth required for login)
// ==========================================
router.post("/auth/login", (req, res) => AdminAuthController.login(req, res));
router.post("/auth/refresh", (req, res) => AdminAuthController.refreshToken(req, res));

// ==========================================
// Protected Routes (Require admin auth)
// ==========================================

// Auth (authenticated)
router.post("/auth/change-password", authenticateAdmin, (req, res) => AdminAuthController.changePassword(req, res));
router.post("/auth/logout", authenticateAdmin, (req, res) => AdminAuthController.logout(req, res));
router.get("/auth/me", authenticateAdmin, (req, res) => AdminAuthController.me(req, res));

// Dashboard
router.get("/dashboard", authenticateAdmin, (req, res) => AdminDashboardController.getStats(req, res));

// At-Risk Users
router.get("/dashboard/users-at-risk", authenticateAdmin, (req, res) => AdminAtRiskController.getAtRiskUsers(req, res));

// ==========================================
// Admin Management (Master Admin Only)
// ==========================================
router.post("/admins", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.createAdmin(req, res));
router.get("/admins", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.getAdmins(req, res));
router.get("/admins/:id", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.getAdminById(req, res));
router.patch("/admins/:id/lock", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.lockAdmin(req, res));
router.patch("/admins/:id/unlock", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.unlockAdmin(req, res));
router.patch("/admins/:id/reset-password", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.resetPassword(req, res));
router.delete("/admins/:id", authenticateAdmin, requireMasterAdmin, (req, res) => AdminManagementController.deleteAdmin(req, res));

// ==========================================
// User Management
// ==========================================
router.get("/users", authenticateAdmin, (req, res) => AdminUserController.getAssignedUsers(req, res));
router.get("/users/all", authenticateAdmin, requireMasterAdmin, (req, res) => AdminUserController.getAllUsers(req, res));
router.post("/users/:userId/assign", authenticateAdmin, (req, res) => AdminUserController.assignUser(req, res));
router.delete("/users/:userId/unassign", authenticateAdmin, (req, res) => AdminUserController.unassignUser(req, res));

// ==========================================
// Task Management (Milestones & Daily Actions)
// ==========================================

// Milestones
router.get("/tasks/milestones", authenticateAdmin, (req, res) => AdminTaskController.getPendingMilestones(req, res));
router.get("/tasks/milestones/:id", authenticateAdmin, (req, res) => AdminTaskController.getMilestoneDetail(req, res));
router.post("/tasks/milestones/:id/approve", authenticateAdmin, (req, res) => AdminTaskController.approveMilestone(req, res));
router.post("/tasks/milestones/:id/reject", authenticateAdmin, (req, res) => AdminTaskController.rejectMilestone(req, res));

// Daily Actions
router.get("/tasks/daily-actions", authenticateAdmin, (req, res) => AdminTaskController.getPendingDailyActions(req, res));
router.get("/tasks/daily-actions/:id", authenticateAdmin, (req, res) => AdminTaskController.getDailyActionDetail(req, res));
router.post("/tasks/daily-actions/:id/approve", authenticateAdmin, (req, res) => AdminTaskController.approveDailyAction(req, res));
router.post("/tasks/daily-actions/:id/reject", authenticateAdmin, (req, res) => AdminTaskController.rejectDailyAction(req, res));

export default router;

