import { ACTIONS, type Action, type CellType, type State } from '../rl/types';
import type { AppState } from '../state/appState';

const arrows: Record<Action, string> = { UP: '↑', RIGHT: '→', DOWN: '↓', LEFT: '←' };
const icons: Partial<Record<CellType, string>> = { start: 'S', goal: '★', trap: '☠', wall: '' };
const positions = [{ x: 50, y: 20 }, { x: 79, y: 55 }, { x: 50, y: 89 }, { x: 21, y: 55 }];
export function gridSvg(app: AppState): string {
  const env = app.environment, cellW = 100, width = env.width * cellW, height = env.height * cellW;
  let body = '';
  env.getCells().forEach((cell, i) => {
    const state: State = { x: i % env.width, y: Math.floor(i / env.width) }; const x = state.x * 100, y = state.y * 100;
    body += `<g class="cell cell-${cell}" data-cell="${i}" tabindex="${app.editing ? 0 : -1}" role="gridcell" aria-label="${cell}, colonne ${state.x + 1}, ligne ${state.y + 1}"><rect x="${x + 1}" y="${y + 1}" width="98" height="98" rx="8"/>`;
    if (icons[cell] !== undefined) body += `<text class="cell-icon" x="${x + 50}" y="${y + 61}">${icons[cell]}</text>`;
    if (cell === 'free' || cell === 'start') {
      const values = app.agent.values(state), best = Math.max(...values);
      ACTIONS.forEach((action, ai) => { const p = positions[ai], isBest = Math.abs(values[ai] - best) < 1e-12;
        if (app.showQ && (!app.policyOnly || isBest)) body += `<text class="qvalue ${isBest ? 'best' : ''}" x="${x + p.x}" y="${y + p.y}">${arrows[action]}${app.policyOnly ? '' : ` ${values[ai].toFixed(2)}`}</text>`;
      });
    }
    if (state.x === app.trainer.state.x && state.y === app.trainer.state.y) body += `<circle class="agent" cx="${x + 50}" cy="${y + 50}" r="14"/><circle class="agent-core" cx="${x + 50}" cy="${y + 50}" r="5"/>`;
    body += '</g>';
  });
  return `<svg id="grid" viewBox="0 0 ${width} ${height}" role="grid" aria-label="GridWorld ${env.width} par ${env.height}">${body}</svg>`;
}
