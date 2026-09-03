export const ACTIONS = ['UP', 'RIGHT', 'DOWN', 'LEFT'] as const;
export type Action = (typeof ACTIONS)[number];
export type CellType = 'free' | 'wall' | 'start' | 'goal' | 'trap';
export interface State { x: number; y: number }
export interface Transition { state: State; action: Action; nextState: State; reward: number; terminal: boolean; outcome: 'goal' | 'trap' | null }
export interface Rewards { goal: number; trap: number; step: number }
export interface TrainingConfig {
  alpha: number; gamma: number; epsilon: number; epsilonMin: number;
  epsilonDecay: number; decayEnabled: boolean; maxSteps: number; rewards: Rewards;
}
export interface QLearningUpdate extends Transition {
  oldValue: number; nextBestValue: number; target: number; newValue: number;
  alpha: number; gamma: number; explored: boolean;
}
export interface EpisodeStats { episode: number; reward: number; steps: number; success: boolean; outcome: 'goal' | 'trap' | 'timeout' }
export interface GridDefinition { name: string; width: number; height: number; cells: CellType[] }
