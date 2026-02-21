import { useRef, useEffect, useState, useCallback } from 'react';
import { ProgressBar, TextField } from '@toss/tds-mobile';
import { useTypingTest } from '../hooks/useTypingTest';
import { useSafeArea } from '../hooks/useSafeArea';
import { useGameUser } from '../hooks/useGameUser';
import { useExitConfirm } from '../hooks/useExitConfirm';
import { useTTSSoundEngine } from '../hooks/useTTSSoundEngine';
import { useComboTracker } from '../hooks/useComboTracker';
import { getSpeedTier } from '../utils/speedTier';
import { TextDisplay } from './TextDisplay';
import { TimerDisplay } from './TimerDisplay';
import { ResultPanel } from './ResultPanel';
import { SoundToggle } from './SoundToggle';
import { ComboDisplay } from './ComboDisplay';
import type { Particle } from './FloatingParticle';
import {
  PageWrapper,
  Container,
  Header,
  Title,
  Subtitle,
} from '../styles/typing.styles';

let particleIdCounter = 0;

export function TypingTest() {
  const inputRef = useRef<HTMLInputElement>(null);
  const insets = useSafeArea();
  const { record, saveRecord } = useGameUser();
  useExitConfirm();

  const { isSoundEnabled, toggleSound, playWord, preloadText } =
    useTTSSoundEngine();
  const combo = useComboTracker();
  const { registerCorrect, registerIncorrect } = combo;

  const onCharCompleted = useCallback(
    (correct: boolean) => {
      if (correct) {
        registerCorrect();
      } else {
        registerIncorrect();
      }
    },
    [registerCorrect, registerIncorrect]
  );

  const onWordCompleted = useCallback(
    (word: string) => {
      playWord(word);
    },
    [playWord]
  );

  const {
    text,
    inputValue,
    isRunning,
    isFinished,
    wpm,
    accuracy,
    errorCount,
    totalTyped,
    handleInput,
    restart,
    handlePaste,
    onCompositionStart,
    onCompositionEnd,
  } = useTypingTest({ onCharCompleted, onWordCompleted });

  const [particles, setParticles] = useState<Particle[]>([]);
  const prevWpmRef = useRef(0);

  const speedTier = getSpeedTier(wpm);

  // Preload TTS audio when text changes
  useEffect(() => {
    preloadText(text);
  }, [text, preloadText]);

  // Floating particles on big WPM jumps
  useEffect(() => {
    if (!isRunning) return;
    const diff = wpm - prevWpmRef.current;
    if (diff >= 10) {
      const id = ++particleIdCounter;
      setParticles(prev => [
        ...prev,
        { id, value: diff, color: speedTier.color },
      ]);
    }
    prevWpmRef.current = wpm;
  }, [wpm, isRunning, speedTier.color]);

  const handleRemoveParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  useEffect(() => {
    if (isFinished && wpm > 0) {
      saveRecord(wpm);
    }
  }, [isFinished, wpm, saveRecord]);

  const handleRestart = () => {
    restart();
    combo.reset();
    setParticles([]);
    prevWpmRef.current = 0;
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const progress = text.length > 0 ? inputValue.length / text.length : 0;

  return (
    <PageWrapper
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16,
      }}
    >
      <Container>
        {!isFinished ? (
          <>
            <Header>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Title>타자 속도 측정기</Title>
                <SoundToggle enabled={isSoundEnabled} onToggle={toggleSound} />
              </div>
              <Subtitle>타이핑하는 순간 바로 속도가 표시됩니다</Subtitle>
              {record && record.bestWpm > 0 && (
                <Subtitle>최고 기록: {record.bestWpm} 타/분</Subtitle>
              )}
            </Header>

            <TimerDisplay
              wpm={wpm}
              isRunning={isRunning}
              speedTier={speedTier}
              particles={particles}
              onRemoveParticle={handleRemoveParticle}
            />

            <ComboDisplay combo={combo.combo} />

            <ProgressBar progress={progress} size="light" animate />
            <TextDisplay text={text} inputValue={inputValue} />
            <TextField
              ref={inputRef}
              variant="box"
              label="타이핑"
              labelOption="appear"
              placeholder="여기에 위 텍스트를 그대로 입력하세요"
              value={inputValue}
              onChange={e => handleInput(e.target.value)}
              onPaste={handlePaste}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              autoFocus
              autoComplete="off"
            />
          </>
        ) : (
          <ResultPanel
            wpm={wpm}
            accuracy={accuracy}
            totalTyped={totalTyped}
            errorCount={errorCount}
            bestWpm={record?.bestWpm ?? 0}
            totalGames={record?.totalGames ?? 0}
            maxCombo={combo.maxCombo}
            onRestart={handleRestart}
          />
        )}
      </Container>
    </PageWrapper>
  );
}
