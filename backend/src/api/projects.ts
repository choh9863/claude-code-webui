import { Router, Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { SessionModel } from '../models/Session';
import type { CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../../../shared/types';

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
    const { name, description, directoryPath } = req.body;

    if (!name || !directoryPath) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Name and directoryPath are required',
      };
      return res.status(400).json(response);
    }

    const project = ProjectModel.create(name, directoryPath, description);

    const response: ApiResponse<typeof project> = {
      success: true,
      data: project,
    };
    res.status(201).json(response);
  } catch (error) {
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
