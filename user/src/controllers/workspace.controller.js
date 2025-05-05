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

    // Scrape website content with hierarchical tree structure
    const scrapeResult = await scrapeWebsite(url);

    if (!scrapeResult.contents || scrapeResult.contents.length === 0) {
      return res.status(400).json({ message: 'Failed to scrape content from the provided URL' });
    }

    // Create new workspace
    const workspace = new Workspace({
      name,
      sourceUrl: url,
      team: teamId,
      contents: scrapeResult.contents,
      navigationTree: scrapeResult.navigationTree,
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

// Helper function to scrape website content with hierarchical tree structure
const scrapeWebsite = async (url, maxDepth = 2, currentDepth = 0, visitedUrls = new Set()) => {
  try {
    // Normalize URL
    const baseUrl = new URL(url).origin;
    const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Skip if already visited or max depth reached
    if (visitedUrls.has(normalizedUrl) || currentDepth > maxDepth) {
      return { contents: [], navigationTree: [] };
    }
    
    console.log(`Scraping ${normalizedUrl} (depth: ${currentDepth}/${maxDepth})`);
    visitedUrls.add(normalizedUrl);
    
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const contents = [];
    const navigationTree = [];
    
    // Extract title and pathnot i
    const pageTitle = $('title').text().trim();
    const urlPath = new URL(normalizedUrl).pathname;
    const pagePath = urlPath === '/' ? 'index' : urlPath.replace(/^\//g, '').replace(/\//g, '-');
    
    // Process main content
    const mainContent = {
      id: pagePath,
      title: pageTitle || 'Main Page',
      content: { 
        type: 'doc', 
        content: [{ 
          type: 'paragraph', 
          content: [{ 
            type: 'text', 
            text: $('main, article, .content, .documentation, #content').text().trim() || $('body').text().trim() 
          }] 
        }] 
      },
      url: normalizedUrl,
      children: []
    };
    
    contents.push(mainContent);
    
    // Extract navigation structure - Look for sidebar/navigation elements
    // This is specific to documentation sites and may need adjustments for different sites
    const navSelectors = [
      // Common selectors for documentation sites
      '.sidebar', '.sidebar-nav', '.docs-sidebar', '.navigation', '.docs-navigation',
      'nav', '#sidebar', '#navigation', '.nav-menu', '.menu', '.toc', '.table-of-contents',
      // Langfuse specific selectors
      '.sidebar-container', '.sidebar-content', '.sidebar-items'
    ];
    
    let navElement = null;
    
    // Find the navigation element using various common selectors
    for (const selector of navSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        navElement = element;
        break;
      }
    }
    
    // If we found a navigation element, extract the tree structure
    if (navElement) {
      // First, try to identify main sections (like "Tracing", "Develop", etc.)
      const mainSections = [];
      const processedTitles = new Set(); // Track processed titles to avoid duplicates
      
      // Process navigation items with better structure matching
      const processNavItems = () => {
        // Look for main section headers
        navElement.find('h2, h3, .section-title, [role="heading"], .heading').each((_, heading) => {
          const sectionTitle = $(heading).text().trim();
          if (!sectionTitle || processedTitles.has(sectionTitle)) return;
          
          processedTitles.add(sectionTitle);
          const sectionId = `section-${sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const section = {
            id: sectionId,
            title: sectionTitle,
            children: [],
            parentId: null
          };
          
          // Find items that belong to this section
          let currentElement = $(heading).next();
          while (currentElement.length && !currentElement.is('h2, h3, .section-title, [role="heading"], .heading')) {
            // Look for links within this section
            currentElement.find('a').each((_, link) => {
              const linkText = $(link).text().trim();
              if (!linkText || processedTitles.has(linkText)) return;
              
              let href = $(link).attr('href');
              if (!href) return;
              
              // Handle relative URLs
              let fullUrl;
              try {
                fullUrl = new URL(href, normalizedUrl).href;
              } catch (e) {
                return;
              }
              
              processedTitles.add(linkText);
              const itemId = `item-${linkText.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
              
              // Check if this item has children (submenu)
              const hasChildren = $(link).closest('li').find('ul').length > 0;
              const childItems = [];
              
              if (hasChildren) {
                $(link).closest('li').find('ul li a').each((_, childLink) => {
                  const childText = $(childLink).text().trim();
                  if (!childText || processedTitles.has(childText)) return;
                  
                  let childHref = $(childLink).attr('href');
                  if (!childHref) return;
                  
                  let childFullUrl;
                  try {
                    childFullUrl = new URL(childHref, normalizedUrl).href;
                  } catch (e) {
                    return;
                  }
                  
                  processedTitles.add(childText);
                  const childId = `item-${childText.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                  
                  childItems.push({
                    id: childId,
                    title: childText,
                    url: childFullUrl,
                    parentId: itemId,
                    children: []
                  });
                });
              }
              
              section.children.push({
                id: itemId,
                title: linkText,
                url: fullUrl,
                parentId: sectionId,
                children: childItems
              });
            });
            
            currentElement = currentElement.next();
          }
          
          if (section.children.length > 0) {
            mainSections.push(section);
          }
        });
        
        // If no sections found with headers, try to extract from the list structure directly
        if (mainSections.length === 0) {
          navElement.find('> ul > li, > div > ul > li').each((_, item) => {
            // Check if this is a section header or just a link
            const sectionTitle = $(item).find('> span, > div > span').first().text().trim() || 
                               $(item).find('> a, > div > a').first().text().trim();
            
            if (!sectionTitle || processedTitles.has(sectionTitle)) return;
            processedTitles.add(sectionTitle);
            
            const sectionId = `section-${sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const section = {
              id: sectionId,
              title: sectionTitle,
              children: [],
              parentId: null
            };
            
            // Find child items
            $(item).find('ul li a').each((_, link) => {
              const linkText = $(link).text().trim();
              if (!linkText || processedTitles.has(linkText)) return;
              
              let href = $(link).attr('href');
              if (!href) return;
              
              // Handle relative URLs
              let fullUrl;
              try {
                fullUrl = new URL(href, normalizedUrl).href;
              } catch (e) {
                return;
              }
              
              processedTitles.add(linkText);
              const itemId = `item-${linkText.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
              
              section.children.push({
                id: itemId,
                title: linkText,
                url: fullUrl,
                parentId: sectionId,
                children: []
              });
            });
            
            if (section.children.length > 0 || $(item).find('ul').length === 0) {
              mainSections.push(section);
            }
          });
        }
        
        return mainSections;
      };
      
      // Process the navigation and add to our tree
      navigationTree.push(...processNavItems());
    } else {
      // Fallback: If no navigation element found, try to build a tree from headings
      const headingTree = [];
      let currentH1 = null;
      let currentH2 = null;
      
      $('h1, h2, h3').each((_, element) => {
        const text = $(element).text().trim();
        if (!text) return;
        
        const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const tagName = $(element).prop('tagName').toLowerCase();
        
        if (tagName === 'h1') {
          currentH1 = { id, title: text, children: [] };
          currentH2 = null;
          headingTree.push(currentH1);
        } else if (tagName === 'h2' && currentH1) {
          currentH2 = { id, title: text, parentId: currentH1.id, children: [] };
          currentH1.children.push(currentH2);
        } else if (tagName === 'h3' && currentH2) {
          currentH2.children.push({ id, title: text, parentId: currentH2.id, children: [] });
        }
      });
      
      navigationTree.push(...headingTree);
    }
    
    // Extract sections with better content targeting
    $('main, article, .content, .documentation, #content').find('h1, h2, h3').each((index, element) => {
      const title = $(element).text().trim();
      
      // Get content until next heading or end of section
      let contentText = '';
      let node = $(element).next();
      while (node.length && !node.is('h1, h2, h3')) {
        contentText += node.text().trim() + ' ';
        node = node.next();
      }
      
      if (title && contentText.trim()) {
        const sectionId = `${pagePath}-section-${index}`;
        contents.push({
          id: sectionId,
          title,
          content: { 
            type: 'doc', 
            content: [{ 
              type: 'paragraph', 
              content: [{ 
                type: 'text', 
                text: contentText.trim() 
              }] 
            }] 
          },
          url: normalizedUrl + '#' + title.toLowerCase().replace(/\s+/g, '-'),
          parentId: pagePath
        });
        
        // Add this section to the main content's children
        mainContent.children.push(sectionId);
      }
    });
    
    // Only proceed with link extraction if we haven't reached max depth
    if (currentDepth < maxDepth) {
      // Find all links in the navigation that are likely documentation pages
      const navLinks = [];
      
      // Extract links from our navigation tree
      const extractLinksFromTree = (items) => {
        items.forEach(item => {
          if (item.url) navLinks.push(item.url);
          if (item.children && item.children.length > 0) {
            extractLinksFromTree(item.children);
          }
        });
      };
      
      extractLinksFromTree(navigationTree);
      
      // If no nav links found, fall back to all links in the page
      if (navLinks.length === 0) {
        $('a').each((_, element) => {
          const href = $(element).attr('href');
          if (!href) return;
          
          // Skip anchors, external links, and non-documentation links
          if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
          if (href.match(/\.(jpg|jpeg|png|gif|pdf|zip|exe)$/i)) return;
          
          // Construct absolute URL
          try {
            const absoluteUrl = new URL(href, normalizedUrl).href;
            
            // Only include links from the same domain and documentation section
            const linkUrl = new URL(absoluteUrl);
            if (linkUrl.origin !== baseUrl) return;
            
            // Check if it's a documentation page (customize this based on the site structure)
            if (normalizedUrl.includes('/docs') && !absoluteUrl.includes('/docs')) return;
            
            navLinks.push(absoluteUrl);
          } catch (e) {
            // Invalid URL, skip
            return;
          }
        });
      }
      
      // Process unique links (limit to 10 per page to avoid overwhelming)
      const uniqueLinks = [...new Set(navLinks)].slice(0, 10);
      
      // Recursively scrape linked pages
      for (const link of uniqueLinks) {
        if (!visitedUrls.has(link)) {
          const result = await scrapeWebsite(link, maxDepth, currentDepth + 1, visitedUrls);
          
          // Merge contents and navigation tree from child pages
          contents.push(...result.contents);
          
          // Add child navigation items to our tree if they're not already there
          result.navigationTree.forEach(childNavItem => {
            // Check if this item already exists in our tree
            const exists = navigationTree.some(item => 
              item.title === childNavItem.title && item.url === childNavItem.url
            );
            
            if (!exists) {
              navigationTree.push(childNavItem);
            }
          });
        }
      }
    }
    
    return { contents, navigationTree };
  } catch (error) {
    console.error(`Website scraping error for ${url}:`, error.message);
    return { contents: [], navigationTree: [] };
  }
};

export { createWorkspace, getTeamWorkspaces, getWorkspaceById, updateContent, addContent };
