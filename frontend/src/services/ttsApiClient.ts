import { TTS_CONFIG, getTTSServerUrl } from './ttsConfig';

export async function fetchTTSAudio(text: string): Promise<ArrayBuffer> {
  const url = `${getTTSServerUrl()}/api/tts/${encodeURIComponent(text)}`;

  const attempt = async (): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TTS API ${res.status}`);
    return res.arrayBuffer();
  };

  try {
    return await attempt();
  } catch {
    // 1회 재시도
    await new Promise(r => setTimeout(r, TTS_CONFIG.retryDelay));
    return attempt();
  }
}

export async function checkTTSServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getTTSServerUrl()}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface BatchResultItem {
  word: string;
  audio: string; // base64
}

interface BatchResponse {
  results: BatchResultItem[];
  errors: Array<{ word: string; error: string }>;
}

export async function fetchTTSAudioBatch(
  words: string[]
): Promise<Map<string, ArrayBuffer>> {
  const url = `${getTTSServerUrl()}/api/tts/batch`;
  const map = new Map<string, ArrayBuffer>();

  const attempt = async (): Promise<Map<string, ArrayBuffer>> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words }),
    });
    if (!res.ok) throw new Error(`TTS Batch API ${res.status}`);

    const data: BatchResponse = await res.json();
    for (const item of data.results) {
      const binary = Uint8Array.from(atob(item.audio), c => c.charCodeAt(0));
      map.set(item.word, binary.buffer as ArrayBuffer);
    }
    return map;
  };

  try {
    return await attempt();
  } catch {
    await new Promise(r => setTimeout(r, TTS_CONFIG.retryDelay));
    return attempt();
  }
}
