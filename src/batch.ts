import dotenv from 'dotenv';
dotenv.config();

import { synthesize } from './services/elevenlabs';

const sampleTexts = [
  '오늘 하루도 최선을 다해 살아가는 당신을 응원합니다.',
];

function extractKoreanWords(texts: string[]): string[] {
  const set = new Set<string>();
  for (const text of texts) {
    const words = text.split(/\s+/);
    for (const word of words) {
      const korean = word.replace(/[^가-힣]/g, '');
      if (korean.length > 0) {
        set.add(korean);
      }
    }
  }
  return [...set];
}

async function main() {
  const words = extractKoreanWords(sampleTexts);
  console.log(`예시 문장: ${sampleTexts.length}개`);
  console.log(`고유 한글 단어: ${words.length}개 → ${words.join(', ')}`);
  console.log('');

  let fetched = 0;

  for (const word of words) {
    process.stdout.write(`[${word}] `);
    try {
      await synthesize(word);
      fetched++;
      process.stdout.write('OK\n');
    } catch (err) {
      process.stdout.write(`FAIL: ${err}\n`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const cached = words.length - fetched;
  console.log(`\n완료! 총 ${words.length}개 (신규 API 호출: ${fetched}, 이미 캐시됨: ${cached})`);
}

main();
