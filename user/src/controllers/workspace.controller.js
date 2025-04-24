import axios from 'axios';
import * as cheerio from 'cheerio';
import Workspace from '../models/workspace.model.js';
import Team from '../models/team.model.js';

// Create a new workspace by scraping a website
const createWorkspace = async (req, res) => {
  try {
    const { name, url, teamId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!name || !url || !teamId) {
      return res.status(400).json({ message: 'Name, URL, and team ID are required' });
    }

    // Check if team exists and user is a member
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found or access denied' });
    }

    // Scrape website content
    const scrapedContent = await scrapeWebsite(url);
    
    if (!scrapedContent || scrapedContent.length === 0) {
      return res.status(400).json({ message: 'Failed to scrape content from the provided URL' });
    }

    // Create new workspace
    const workspace = new Workspace({
      name,
      sourceUrl: url,
      team: teamId,
      contents: scrapedContent,
      createdBy: userId
    });

    await workspace.save();

    // Add workspace to team
    await Team.findByIdAndUpdate(teamId, { $push: { workspaces: workspace._id } });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error during workspace creation' });
  }
};

// Get all workspaces for a team
const getTeamWorkspaces = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId;

    // Check if team exists and user is a member
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found or access denied' });
    }

    // Get workspaces
    const workspaces = await Workspace.find({ team: teamId });

    res.status(200).json({ workspaces });
  } catch (error) {
    console.error('Get team workspaces error:', error);
    res.status(500).json({ message: 'Server error while fetching workspaces' });
  }
};

// Get workspace by ID
const getWorkspaceById = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;

    // Find workspace and check access
    const workspace = await Workspace.findById(workspaceId).populate('team');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is a member of the team
    const team = await Team.findOne({
      _id: workspace.team,
      $or: [
        { owner: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    });

    if (!team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ message: 'Server error while fetching workspace' });
  }
};

// Update content in workspace
const updateContent = async (req, res) => {
  try {
    const { workspaceId, contentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user has access to workspace
    const team = await Team.findOne({
      _id: workspace.team,
      $or: [
        { owner: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    });

    if (!team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find and update content
    const contentItem = workspace.contents.id(contentId);
    
    if (!contentItem) {
      return res.status(404).json({ message: 'Content not found' });
    }

    contentItem.content = content;
    contentItem.lastEditedBy = userId;
    contentItem.lastEditedAt = Date.now();

    await workspace.save();

    res.status(200).json({
      message: 'Content updated successfully',
      content: contentItem
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ message: 'Server error while updating content' });
  }
};

// Add new content to workspace
const addContent = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, content, path, parentPath } = req.body;
    const userId = req.userId;

    // Validate input
    if (!title || !content || !path) {
      return res.status(400).json({ message: 'Title, content, and path are required' });
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user has access to workspace
    const team = await Team.findOne({
      _id: workspace.team,
      $or: [
        { owner: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    });

    if (!team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add new content
    workspace.contents.push({
      title,
      content,
      path,
      parentPath: parentPath || '',
      lastEditedBy: userId,
      lastEditedAt: Date.now()
    });

    await workspace.save();

    res.status(201).json({
      message: 'Content added successfully',
      content: workspace.contents[workspace.contents.length - 1]
    });
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({ message: 'Server error while adding content' });
  }
};

// Helper function to scrape website content
const scrapeWebsite = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const contents = [];
    
    // Extract title
    const pageTitle = $('title').text().trim();
    
    // Process main content
    const mainContent = {
      title: pageTitle || 'Main Page',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: $('body').text().trim() }] }] },
      path: 'index',
      parentPath: ''
    };
    
    contents.push(mainContent);
    
    // Extract sections
    $('h1, h2, h3').each((index, element) => {
      const title = $(element).text().trim();
      const content = $(element).next().text().trim();
      
      if (title && content) {
        contents.push({
          title,
          content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
          path: `section-${index}`,
          parentPath: 'index'
        });
      }
    });
    
    return contents;
  } catch (error) {
    console.error('Website scraping error:', error);
    return [];
  }
};

export { createWorkspace, getTeamWorkspaces, getWorkspaceById, updateContent, addContent };
