import {
  getCachedAudio,
  getCachedAudioBatch,
  setCachedAudio,
} from './ttsIndexedDB';
import { fetchTTSAudio, fetchTTSAudioBatch } from './ttsApiClient';
import { TTS_CONFIG } from './ttsConfig';

export class TTSAudioCache {
  private memory = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private ctx: AudioContext;

  private preloadTotal = 0;
  private preloadLoaded = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /** 동기 — 메모리 캐시만 확인 */
  get(char: string): AudioBuffer | null {
    return this.memory.get(char) ?? null;
  }

  /** 비동기 — 메모리 → IDB → API 순서 */
  async getOrFetch(char: string): Promise<AudioBuffer | null> {
    const mem = this.memory.get(char);
    if (mem) return mem;

    // 동일 글자 중복 요청 방지
    const existing = this.pending.get(char);
    if (existing) return existing;

    const promise = this.fetchAndCache(char);
    this.pending.set(char, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(char);
    }
  }

  /** Batch API를 활용한 사전 로딩 */
  async preloadChars(chars: string[]): Promise<void> {
    // IDB에서 이미 캐싱된 것 배치 조회
    const idbCached = await getCachedAudioBatch(chars);
    for (const [char, buf] of idbCached) {
      if (!this.memory.has(char)) {
        try {
          const audioBuf = await this.ctx.decodeAudioData(buf.slice(0));
          this.memory.set(char, audioBuf);
        } catch {
          // 디코딩 실패 무시
        }
      }
    }

    // 아직 메모리에 없는 글자만 Batch API 호출
    const uncached = chars.filter(c => !this.memory.has(c));
    this.preloadTotal = uncached.length;
    this.preloadLoaded = 0;

    if (uncached.length === 0) return;

    try {
      const batchResult = await fetchTTSAudioBatch(uncached);
      for (const [word, raw] of batchResult) {
        try {
          setCachedAudio(word, raw.slice(0));
          const audioBuf = await this.ctx.decodeAudioData(raw.slice(0));
          this.memory.set(word, audioBuf);
          this.preloadLoaded++;
        } catch {
          // 개별 디코딩 실패 무시
        }
      }
    } catch {
      // Batch API 실패 시 개별 요청으로 폴백
      const max = TTS_CONFIG.maxConcurrent;
      let idx = 0;

      const next = async (): Promise<void> => {
        while (idx < uncached.length) {
          const char = uncached[idx++];
          await this.getOrFetch(char);
          this.preloadLoaded++;
        }
      };

      const workers = Array.from(
        { length: Math.min(max, uncached.length) },
        () => next()
      );
      await Promise.allSettled(workers);
    }
  }

  getPreloadProgress(): { loaded: number; total: number } {
    return { loaded: this.preloadLoaded, total: this.preloadTotal };
  }

  private async fetchAndCache(char: string): Promise<AudioBuffer | null> {
    // IDB 확인
    try {
      const idbData = await getCachedAudio(char);
      if (idbData) {
        const audioBuf = await this.ctx.decodeAudioData(idbData.slice(0));
        this.memory.set(char, audioBuf);
        return audioBuf;
      }
    } catch {
      // IDB 실패 시 API로 진행
    }

    // API 호출
    try {
      const raw = await fetchTTSAudio(char);
      // IDB에 저장 (fire-and-forget)
      setCachedAudio(char, raw.slice(0));
      const audioBuf = await this.ctx.decodeAudioData(raw);
      this.memory.set(char, audioBuf);
      return audioBuf;
    } catch {
      return null;
    }
  }
}
