import Team from '../models/team.model.js';
import User from '../models/user.model.js';

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    const team = new Team({
      name,
      owner: userId,
      members: [{ user: userId, email: req.user.email, status: 'active', role: 'admin' }]
    });

    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, { $push: { teams: team._id } });

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error during team creation' });
  }
};

// Get all teams for a user
const getUserTeams = async (req, res) => {
  try {
    const userId = req.userId;

    // Find teams where user is owner or member
    const teams = await Team.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).populate('owner', 'email');

    res.status(200).json({ teams });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ message: 'Server error while fetching teams' });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.userId;

    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).populate('owner', 'email').populate('members.user', 'email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found or access denied' });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error while fetching team' });
  }
};

// Invite a member to a team
const inviteTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const teamId = req.params.teamId;
    const userId = req.userId;

    // Check if team exists and user is owner or admin
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: userId },
        { 
          'members.user': userId, 
          'members.role': 'admin',
          'members.status': 'active'
        }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found or access denied' });
    }

    // Check if user is already a member
    const isMember = team.members.some(member => member.email === email);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    
    // Add member to team
    const newMember = {
      email,
      role: role || 'editor',
      status: 'pending'
    };
    
    if (user) {
      newMember.user = user._id;
    }
    
    team.members.push(newMember);
    await team.save();

    // If user exists, add team to user's teams
    if (user) {
      await User.findByIdAndUpdate(user._id, { $push: { teams: team._id } });
    }

    res.status(200).json({
      message: 'Team invitation sent successfully',
      team
    });
  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({ message: 'Server error during invitation' });
  }
};

// Accept team invitation
const acceptInvitation = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.userId;
    const userEmail = req.user.email;

    // Find team with pending invitation for this user
    const team = await Team.findOne({
      _id: teamId,
      'members.email': userEmail,
      'members.status': 'pending'
    });

    if (!team) {
      return res.status(404).json({ message: 'No pending invitation found' });
    }

    // Update member status
    await Team.updateOne(
      { _id: teamId, 'members.email': userEmail },
      { 
        $set: { 
          'members.$.status': 'active',
          'members.$.user': userId 
        } 
      }
    );

    // Add team to user's teams if not already there
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { teams: teamId } }
    );

    res.status(200).json({ message: 'Team invitation accepted successfully' });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error while accepting invitation' });
  }
};

export { createTeam, getUserTeams, getTeamById, inviteTeamMember, acceptInvitation };
