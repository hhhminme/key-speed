import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { synthesize } from '../services/elevenlabs';

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

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

      const etag = `"${crypto.createHash('md5').update(audio).digest('hex')}"`;
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      res.set('Content-Type', 'audio/mpeg');
      res.set(
        'Cache-Control',
        `public, max-age=${ONE_WEEK_SECONDS}, immutable`
      );
      res.set('ETag', etag);
      res.send(audio);
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ error: 'Failed to synthesize speech' });
    }
  }
);

export default router;
