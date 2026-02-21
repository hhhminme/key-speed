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
