import { Environment } from './Environment';
import { QLearningAgent } from './QLearningAgent';
import type { EpisodeStats, QLearningUpdate, State, TrainingConfig } from './types';

export class TrainingController {
  state: State; episodeReward = 0; episodeSteps = 0; totalSteps = 0; episodes = 0;
  history: EpisodeStats[] = []; lastUpdate: QLearningUpdate | null = null;
  constructor(public environment: Environment, public agent: QLearningAgent, public config: TrainingConfig) { this.state = environment.getStart(); }
  step(): { update: QLearningUpdate; episode: EpisodeStats | null } {
    const choice = this.agent.selectAction(this.state);
    const transition = this.environment.transition(this.state, choice.action);
    const update = this.agent.learn(transition, choice.explored); this.lastUpdate = update;
    this.state = transition.nextState; this.episodeReward += transition.reward; this.episodeSteps++; this.totalSteps++;
    const timedOut = this.episodeSteps >= this.config.maxSteps;
    if (!transition.terminal && !timedOut) return { update, episode: null };
    const stats: EpisodeStats = { episode: ++this.episodes, reward: this.episodeReward, steps: this.episodeSteps, success: transition.outcome === 'goal', outcome: transition.outcome ?? 'timeout' };
    this.history.push(stats); this.state = this.environment.getStart(); this.episodeReward = 0; this.episodeSteps = 0;
    if (this.config.decayEnabled) this.config.epsilon = Math.max(this.config.epsilonMin, this.config.epsilon * this.config.epsilonDecay);
    return { update, episode: stats };
  }
  runEpisode(): EpisodeStats { let result: EpisodeStats | null = null; while (!result) result = this.step().episode; return result; }
  reset(): void { this.agent.reset(); this.state = this.environment.getStart(); this.episodeReward = 0; this.episodeSteps = 0; this.totalSteps = 0; this.episodes = 0; this.history = []; this.lastUpdate = null; }
}
