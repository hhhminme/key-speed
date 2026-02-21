import { Router, Request, Response } from 'express';
import { synthesize } from '../services/elevenlabs';

const router = Router();

function isKoreanText(text: string): boolean {
  if (text.length === 0 || text.length > 10) return false;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return false;
  }
  return true;
}

router.get(
  '/:text',
  async (req: Request<{ text: string }>, res: Response): Promise<void> => {
    const text = req.params.text as string;

    if (!isKoreanText(text)) {
      res.status(400).json({
        error:
          'Invalid text. Must be Korean syllables (U+AC00~U+D7A3), max 10 characters.',
      });
      return;
    }

    try {
      const audio = await synthesize(text);
      res.set('Content-Type', 'audio/mpeg');
      res.send(audio);
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ error: 'Failed to synthesize speech' });
    }
  }
);

export default router;
