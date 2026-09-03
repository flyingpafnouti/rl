import type { EpisodeStats } from '../rl/types';

function sample(values: number[], max = 500): number[] {
  if (values.length <= max) return values;
  const bucket = values.length / max; return Array.from({ length: max }, (_, i) => {
    const start = Math.floor(i * bucket), end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    return values.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
  });
}
function path(values: number[], min: number, max: number, width: number, height: number): string {
  const range = max - min || 1; return values.map((v, i) => `${i ? 'L' : 'M'} ${(i / Math.max(1, values.length - 1) * width).toFixed(1)} ${(height - (v - min) / range * height).toFixed(1)}`).join(' ');
}
export function chartSvg(history: EpisodeStats[], kind: 'reward' | 'steps'): string {
  const raw = history.map(e => kind === 'reward' ? e.reward : e.steps); const values = sample(raw);
  const rollingRaw = raw.map((_, i) => { const part = raw.slice(Math.max(0, i - 19), i + 1); return part.reduce((a, b) => a + b, 0) / part.length; });
  const rolling = sample(rollingRaw); const all = [...values, ...rolling, 0]; const min = Math.min(...all), max = Math.max(...all);
  return `<svg class="chart" viewBox="0 0 800 190" role="img" aria-label="${kind === 'reward' ? 'Récompense par épisode' : 'Pas par épisode'}">
    <line x1="0" y1="185" x2="800" y2="185" class="axis"/><line x1="0" y1="5" x2="0" y2="185" class="axis"/>
    ${values.length > 1 ? `<path d="${path(values, min, max, 800, 180)}" class="series raw"/><path d="${path(rolling, min, max, 800, 180)}" class="series average"/>` : ''}
    <text x="8" y="17">${max.toFixed(2)}</text><text x="8" y="180">${min.toFixed(2)}</text><text x="700" y="180">${history.length} épisodes</text>
  </svg>`;
}
