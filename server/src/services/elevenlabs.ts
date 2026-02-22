import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(__dirname, '../../cache');

const AUDIO_TAGS = [
  '[excited]',
  '[angry]',
  '[happy]',
  '[sad]',
  '[surprised]',
  '[annoyed]',
  '[curious]',
  '[sarcastic]',
  '[whispers]',
  '[laughs]',
  '[mischievously]',
] as const;

function pickRandomTag(): string {
  return AUDIO_TAGS[Math.floor(Math.random() * AUDIO_TAGS.length)];
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(text: string): string {
  const name = [...text].map(ch => ch.charCodeAt(0)).join('_');
  return path.join(CACHE_DIR, `${name}.mp3`);
}

export async function synthesize(text: string): Promise<Buffer> {
  ensureCacheDir();

  const cachePath = getCachePath(text);

  if (fs.existsSync(cachePath)) {
    return fs.promises.readFile(cachePath);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  const callElevenLabs = async (): Promise<globalThis.Response> => {
    return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: pickRandomTag() + ' ' + text + '!',
        model_id: 'eleven_v3',
        language_code: 'ko',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      }),
    });
  };

  let response = await callElevenLabs();

  // 429 rate limit → 재시도 (최대 2회)
  for (let i = 0; i < 2 && response.status === 429; i++) {
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    response = await callElevenLabs();
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(cachePath, buffer);

  return buffer;
}
