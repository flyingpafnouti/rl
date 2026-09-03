import { Environment } from '../src/rl/Environment';
import { QLearningAgent } from '../src/rl/QLearningAgent';
import { Random } from '../src/rl/Random';
import { TrainingController } from '../src/rl/TrainingController';
import { defaultConfig, environments } from '../src/presets/presets';

const config = defaultConfig();
const environment = new Environment(environments.Easy, config.rewards);
const trainer = new TrainingController(environment, new QLearningAgent(config, new Random(42)), config);
const started = performance.now();
for (let index = 0; index < 10_000; index++) trainer.runEpisode();
console.log(`10 000 épisodes : ${(performance.now() - started).toFixed(1)} ms, ${trainer.totalSteps} transitions`);
