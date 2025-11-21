import { Router, Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { SessionModel } from '../models/Session';
import type { CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// GET /api/projects - Get all projects
router.get('/', (req: Request, res: Response) => {
  try {
    const projects = ProjectModel.findAll();
    const response: ApiResponse<typeof projects> = {
      success: true,
      data: projects,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = ProjectModel.findById(id);

    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof project> = {
      success: true,
      data: project,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// POST /api/projects - Create new project
router.post('/', (req: Request<{}, {}, CreateProjectRequest>, res: Response) => {
  try {
    const { name, description } = req.body;
    console.log('Creating project:', { name, description });

    if (!name) {
      console.error('Project creation failed: Name is required');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Name is required',
      };
      return res.status(400).json(response);
    }

    // Generate unique project ID and directory path
    const projectId = uuidv4();
    const projectsBaseDir = path.join(process.cwd(), 'projects');
    const directoryPath = path.join(projectsBaseDir, projectId);

    console.log('Generated project path:', directoryPath);

    // Create the projects directory if it doesn't exist
    if (!fs.existsSync(projectsBaseDir)) {
      console.log('Creating projects base directory:', projectsBaseDir);
      fs.mkdirSync(projectsBaseDir, { recursive: true });
    }

    // Create the project directory
    console.log('Creating project directory:', directoryPath);
    fs.mkdirSync(directoryPath, { recursive: true });

    const project = ProjectModel.create(name, directoryPath, description);
    console.log('Project created in database:', project);

    const response: ApiResponse<typeof project> = {
      success: true,
      data: project,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating project:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', (req: Request<{ id: string }, {}, UpdateProjectRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = ProjectModel.update(id, updates);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found or no changes made',
      };
      return res.status(404).json(response);
    }

    const project = ProjectModel.findById(id);
    const response: ApiResponse<typeof project> = {
      success: true,
      data: project!,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = ProjectModel.delete(id);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// GET /api/projects/:id/sessions - Get sessions for a project
router.get('/:id/sessions', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessions = SessionModel.findByProjectId(id);

    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

export default router;
