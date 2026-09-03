import { Environment } from '../rl/Environment';
import { QLearningAgent } from '../rl/QLearningAgent';
import { Random } from '../rl/Random';
import { TrainingController } from '../rl/TrainingController';
import type { CellType, TrainingConfig } from '../rl/types';
import { defaultConfig, environments } from '../presets/presets';

export type Theme = 'light' | 'dark' | 'system';
export class AppState {
  config: TrainingConfig = defaultConfig(); seed = 42; environmentName = 'Easy';
  environment = new Environment(environments.Easy, this.config.rewards);
  agent = new QLearningAgent(this.config, new Random(this.seed));
  trainer = new TrainingController(this.environment, this.agent, this.config);
  running = false; mode: 'observer' | 'turbo' = 'observer'; speed = 5;
  showQ = true; policyOnly = false; editing = false; brush: CellType = 'wall'; theme: Theme = 'system';
  rebuild(environment = this.environment): void {
    this.environment = environment; this.environment.setRewards(this.config.rewards);
    this.agent = new QLearningAgent(this.config, new Random(this.seed));
    this.trainer = new TrainingController(this.environment, this.agent, this.config);
  }
  resetLearning(): void { this.config.epsilon = Math.max(this.config.epsilon, this.config.epsilonMin); this.agent.setRandom(new Random(this.seed)); this.trainer.reset(); }
}
