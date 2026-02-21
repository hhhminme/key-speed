import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import ttsRouter from './routes/tts';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tts', ttsRouter);

app.listen(port, () => {
  console.log(`key-speed-server running on http://localhost:${port}`);
});
