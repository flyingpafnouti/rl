import { ACTIONS, type Action, type QLearningUpdate, type State, type TrainingConfig, type Transition } from './types';
import { Random } from './Random';

export class QLearningAgent {
  private q = new Map<string, number[]>();
  constructor(private config: TrainingConfig, private random: Random) {}
  setConfig(config: TrainingConfig): void { this.config = config; }
  setRandom(random: Random): void { this.random = random; }
  reset(): void { this.q.clear(); }
  values(state: State): readonly number[] { return this.ensure(state); }
  bestActions(state: State): Action[] {
    const values = this.ensure(state); const max = Math.max(...values);
    return ACTIONS.filter((_, i) => Math.abs(values[i] - max) < 1e-12);
  }
  selectAction(state: State): { action: Action; explored: boolean } {
    if (this.random.next() < this.config.epsilon) return { action: ACTIONS[this.random.int(ACTIONS.length)], explored: true };
    const best = this.bestActions(state); return { action: best[this.random.int(best.length)], explored: false };
  }
  learn(transition: Transition, explored = false): QLearningUpdate {
    const values = this.ensure(transition.state); const index = ACTIONS.indexOf(transition.action);
    const oldValue = values[index];
    const nextBestValue = transition.terminal ? 0 : Math.max(...this.ensure(transition.nextState));
    const target = transition.reward + (transition.terminal ? 0 : this.config.gamma * nextBestValue);
    const newValue = oldValue + this.config.alpha * (target - oldValue);
    values[index] = newValue;
    return { ...transition, oldValue, nextBestValue, target, newValue, alpha: this.config.alpha, gamma: this.config.gamma, explored };
  }
  private ensure(state: State): number[] {
    const key = `${state.x},${state.y}`; let values = this.q.get(key);
    if (!values) { values = [0, 0, 0, 0]; this.q.set(key, values); }
    return values;
  }
}
