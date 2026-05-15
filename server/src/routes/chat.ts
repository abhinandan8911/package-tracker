import { Router } from 'express';
import { z } from 'zod';
import { answerQuery, SUGGESTED_QUESTIONS } from '../services/chatEngine';

const router = Router();

const MessageSchema = z.object({
  message: z.string().min(1).max(500).trim(),
});

router.post('/', (req, res, next) => {
  try {
    const { message } = MessageSchema.parse(req.body);
    const result = answerQuery(message);
    res.json({ answer: result.answer, matchedCount: result.matchedCount });
  } catch (err) {
    next(err);
  }
});

router.get('/suggestions', (_req, res) => {
  res.json({ suggestions: SUGGESTED_QUESTIONS });
});

export default router;
