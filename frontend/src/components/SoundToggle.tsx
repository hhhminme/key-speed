import { Button } from '@toss/tds-mobile';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <Button
      size="small"
      variant="weak"
      onClick={onToggle}
      aria-label={enabled ? '사운드 끄기' : '사운드 켜기'}
    >
      {enabled ? '🔊' : '🔇'}
    </Button>
  );
}
