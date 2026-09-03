import type { Action, CellType, GridDefinition, Rewards, State, Transition } from './types';

const DELTAS: Record<Action, State> = {
  UP: { x: 0, y: -1 }, RIGHT: { x: 1, y: 0 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 },
};

export class Environment {
  readonly width: number;
  readonly height: number;
  private cells: CellType[];
  constructor(definition: GridDefinition, private rewards: Rewards) {
    this.width = definition.width; this.height = definition.height; this.cells = [...definition.cells];
    this.validate();
  }
  setRewards(rewards: Rewards): void { this.rewards = rewards; }
  getCells(): CellType[] { return [...this.cells]; }
  getCell(state: State): CellType { return this.cells[this.index(state)] ?? 'wall'; }
  getStart(): State { const i = this.cells.indexOf('start'); return { x: i % this.width, y: Math.floor(i / this.width) }; }
  isTerminal(state: State): boolean { const cell = this.getCell(state); return cell === 'goal' || cell === 'trap'; }
  transition(state: State, action: Action): Transition {
    const delta = DELTAS[action];
    const candidate = { x: state.x + delta.x, y: state.y + delta.y };
    const blocked = candidate.x < 0 || candidate.y < 0 || candidate.x >= this.width || candidate.y >= this.height || this.getCell(candidate) === 'wall';
    const nextState = blocked ? { ...state } : candidate;
    const cell = this.getCell(nextState);
    const outcome = cell === 'goal' ? 'goal' : cell === 'trap' ? 'trap' : null;
    const reward = outcome === 'goal' ? this.rewards.goal : outcome === 'trap' ? this.rewards.trap : this.rewards.step;
    return { state: { ...state }, action, nextState, reward, terminal: outcome !== null, outcome };
  }
  setCell(state: State, type: CellType): void {
    const idx = this.index(state);
    const previous = [...this.cells];
    if (type === 'start') this.cells = this.cells.map(c => c === 'start' ? 'free' : c);
    this.cells[idx] = type;
    try { this.validate(); } catch (error) { this.cells = previous; throw error; }
  }
  toDefinition(name = 'Custom'): GridDefinition { return { name, width: this.width, height: this.height, cells: [...this.cells] }; }
  private index(state: State): number { return state.y * this.width + state.x; }
  private validate(): void {
    if (this.cells.length !== this.width * this.height) throw new Error('Invalid grid dimensions');
    if (this.cells.filter(c => c === 'start').length !== 1) throw new Error('A grid needs exactly one start');
    if (!this.cells.includes('goal')) throw new Error('A grid needs at least one goal');
  }
}
