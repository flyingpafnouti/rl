import type { GridDefinition, TrainingConfig } from '../rl/types';

const grid = (name: string, rows: string[]): GridDefinition => ({
  name, width: rows[0].length, height: rows.length,
  cells: rows.join('').split('').map(char => ({ S: 'start', '#': 'wall', G: 'goal', X: 'trap', '.': 'free' }[char] ?? 'free')) as GridDefinition['cells'],
});

export const environments = {
  Easy: grid('Easy', ['S....', '.##..', '....X', '.#...', '....G']),
  Maze: grid('Maze', ['S#...', '.#.#.', '...#.', '##...', '...#G']),
  'Risky Shortcut': grid('Risky Shortcut', ['S....', '.....', '.XXX.', '.....', '....G']),
  'Exploration Trap': grid('Exploration Trap', ['S...G', '.###.', '.....', '.XXX.', '....G']),
};

export const defaultConfig = (): TrainingConfig => ({ alpha: .2, gamma: .95, epsilon: .2, epsilonMin: .02, epsilonDecay: .995, decayEnabled: true, maxSteps: 100, rewards: { goal: 1, trap: -1, step: -.01 } });

export interface LearningPreset { environment: keyof typeof environments; patch: Partial<TrainingConfig>; description: string }
export const learningPresets: Record<string, LearningPreset> = {
  Balanced: { environment: 'Easy', patch: {}, description: 'Un compromis stable entre exploration et exploitation.' },
  'Low Exploration': { environment: 'Risky Shortcut', patch: { epsilon: .03, epsilonMin: .01 }, description: 'Peu d’exploration : l’agent peut se fixer trop tôt sur une stratégie médiocre.' },
  'High Exploration': { environment: 'Easy', patch: { epsilon: .8, epsilonMin: .3 }, description: 'L’agent découvre beaucoup, mais son comportement reste moins stable.' },
  'Myopic Agent': { environment: 'Maze', patch: { gamma: .2 }, description: 'Gamma faible : les récompenses éloignées comptent peu.' },
  'Aggressive Learning': { environment: 'Exploration Trap', patch: { alpha: .9 }, description: 'Alpha élevé : chaque expérience corrige fortement les estimations.' },
};
