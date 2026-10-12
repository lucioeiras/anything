export const AUDIO_WAVEFORM_BAR_COUNT = 48;

/** Maps recorder metering in dBFS to a compact, visible 0–100 bar height. */
export function normalizeAudioMetering(meteringDb: number): number {
  if (!Number.isFinite(meteringDb)) return 8;
  return Math.round(Math.min(100, Math.max(8, ((meteringDb + 60) / 60) * 100)));
}

/** Compresses real recorder metering samples into a fixed-size peak envelope. */
export function buildAudioWaveform(
  samples: readonly number[],
  barCount = AUDIO_WAVEFORM_BAR_COUNT
): number[] {
  if (samples.length === 0 || barCount <= 0) return [];
  return Array.from({ length: barCount }, (_, barIndex) => {
    const start = Math.floor((barIndex * samples.length) / barCount);
    const end = Math.max(start + 1, Math.floor(((barIndex + 1) * samples.length) / barCount));
    let peak = 0;
    for (let i = start; i < Math.min(end, samples.length); i += 1) {
      if (Number.isFinite(samples[i])) peak = Math.max(peak, samples[i]);
    }
    return Math.min(100, Math.max(8, Math.round(peak)));
  });
}

/** Validates waveform metadata read from card JSON or a route parameter. */
export function parseAudioWaveform(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const waveform = value
    .slice(0, AUDIO_WAVEFORM_BAR_COUNT)
    .filter((bar): bar is number => typeof bar === 'number' && Number.isFinite(bar))
    .map((bar) => Math.min(100, Math.max(8, Math.round(bar))));
  return waveform.length > 0 ? waveform : undefined;
}
