import express from 'express';
import { createWorkspace, getTeamWorkspaces, getWorkspaceById, updateContent, addContent } from '../controllers/workspace.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Workspace routes
router.post('/', createWorkspace);
router.get('/team/:teamId', getTeamWorkspaces);
router.get('/:workspaceId', getWorkspaceById);
router.put('/:workspaceId/content/:contentId', updateContent);
router.post('/:workspaceId/content', addContent);

export default router;
