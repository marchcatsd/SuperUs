import express from 'express';
import { createTeam, getUserTeams, getTeamById, inviteTeamMember, acceptInvitation } from '../controllers/team.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Team routes
router.post('/', createTeam);
router.get('/', getUserTeams);
router.get('/:teamId', getTeamById);
router.post('/:teamId/invite', inviteTeamMember);
router.post('/:teamId/accept', acceptInvitation);

export default router;
