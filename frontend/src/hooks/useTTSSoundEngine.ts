import { useCallback, useRef } from 'react';
import { useSoundEngine } from './useSoundEngine';
import { TTSAudioCache } from '../services/ttsAudioCache';

export function useTTSSoundEngine() {
  const sound = useSoundEngine();
  const { isSoundEnabled, getCtx, toggleSound } = sound;

  const cacheRef = useRef<TTSAudioCache | null>(null);

  const getCache = useCallback(() => {
    if (!cacheRef.current) {
      const ctx = getCtx();
      cacheRef.current = new TTSAudioCache(ctx);
    }
    return cacheRef.current;
  }, [getCtx]);

  const playWord = useCallback(
    async (word: string) => {
      if (!isSoundEnabled || !word) return;

      const cache = getCache();
      const buffer = cache.get(word) ?? (await cache.getOrFetch(word));
      if (!buffer) return;

      try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') await ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.8;
        source.connect(gain).connect(ctx.destination);
        source.start();
      } catch {
        // 재생 실패 시 무음
      }
    },
    [isSoundEnabled, getCtx, getCache]
  );

  const preloadText = useCallback(
    (text: string) => {
      const words = text
        .split(/\s+/)
        .map(w => w.replace(/[^가-힣]/g, ''))
        .filter(Boolean);
      if (words.length === 0) return;
      const uniqueWords = [...new Set(words)];
      const cache = getCache();
      cache.preloadChars(uniqueWords);
    },
    [getCache]
  );

  return {
    isSoundEnabled,
    toggleSound,
    playWord,
    preloadText,
  };
}
