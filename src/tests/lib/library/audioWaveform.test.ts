import {
  AUDIO_WAVEFORM_BAR_COUNT,
  buildAudioWaveform,
  normalizeAudioMetering,
  parseAudioWaveform,
} from '@/lib/library/audioWaveform';

describe('audio waveform', () => {
  it('normalizes recorder dBFS samples into visible bar heights', () => {
    expect(normalizeAudioMetering(-160)).toBe(8);
    expect(normalizeAudioMetering(-30)).toBe(50);
    expect(normalizeAudioMetering(0)).toBe(100);
  });

  it('compresses samples into fixed peak buckets', () => {
    expect(buildAudioWaveform([12, 28, 31, 60], 2)).toEqual([28, 60]);
    expect(buildAudioWaveform([])).toEqual([]);
    expect(buildAudioWaveform([24])).toHaveLength(AUDIO_WAVEFORM_BAR_COUNT);
  });

  it('validates waveform data loaded from a card', () => {
    expect(parseAudioWaveform([3, 45, 140, 'invalid'])).toEqual([8, 45, 100]);
    expect(parseAudioWaveform([])).toBeUndefined();
    expect(parseAudioWaveform('not an array')).toBeUndefined();
  });
});
