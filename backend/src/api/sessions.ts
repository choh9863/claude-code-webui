import { Router, Request, Response } from 'express';
import { SessionModel } from '../models/Session';
import { MessageModel } from '../models/Message';
import type { CreateSessionRequest, UpdateSessionRequest, ApiResponse } from '../../../shared/types';

const router = Router();

// GET /api/sessions - Get all sessions
router.get('/', (req: Request, res: Response) => {
  try {
    const sessions = SessionModel.findAll();
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

// GET /api/sessions/:id - Get session by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = SessionModel.findById(id);

    if (!session) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Session not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof session> = {
      success: true,
      data: session,
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

// POST /api/sessions - Create new session
router.post('/', (req: Request<{}, {}, CreateSessionRequest>, res: Response) => {
  try {
    const { projectId, name, autoSaveEnabled, contextCompressionEnabled } = req.body;

    if (!projectId || !name) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'projectId and name are required',
      };
      return res.status(400).json(response);
    }

    const session = SessionModel.create(
      projectId,
      name,
      autoSaveEnabled ?? true,
      contextCompressionEnabled ?? false
    );

    const response: ApiResponse<typeof session> = {
      success: true,
      data: session,
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

// PUT /api/sessions/:id - Update session
router.put('/:id', (req: Request<{ id: string }, {}, UpdateSessionRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = SessionModel.update(id, updates);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Session not found or no changes made',
      };
      return res.status(404).json(response);
    }

    const session = SessionModel.findById(id);
    const response: ApiResponse<typeof session> = {
      success: true,
      data: session!,
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

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = SessionModel.delete(id);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Session not found',
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

// GET /api/sessions/:id/messages - Get messages for a session
router.get('/:id/messages', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const messages = MessageModel.findBySessionId(id, limit, offset);

    const response: ApiResponse<typeof messages> = {
      success: true,
      data: messages,
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
