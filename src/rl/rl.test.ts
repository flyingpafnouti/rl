import { describe, expect, it } from 'vitest';
import { Environment } from './Environment';
import { QLearningAgent } from './QLearningAgent';
import { Random } from './Random';
import type { GridDefinition, TrainingConfig } from './types';

const definition: GridDefinition = { name: 'test', width: 3, height: 2, cells: ['start','wall','goal','free','free','trap'] };
const config = (epsilon = 0): TrainingConfig => ({ alpha: .2, gamma: .95, epsilon, epsilonMin: 0, epsilonDecay: 1, decayEnabled: false, maxSteps: 10, rewards: { goal: 1, trap: -1, step: -.01 } });
describe('Environment', () => {
  it('moves on a valid transition', () => { const e = new Environment(definition, config().rewards); expect(e.transition({x:0,y:0}, 'DOWN').nextState).toEqual({x:0,y:1}); });
  it('cannot cross a wall or boundary', () => { const e = new Environment(definition, config().rewards); expect(e.transition({x:0,y:0}, 'RIGHT').nextState).toEqual({x:0,y:0}); expect(e.transition({x:0,y:0}, 'UP').nextState).toEqual({x:0,y:0}); });
  it('detects terminal states', () => { const e = new Environment(definition, config().rewards); expect(e.isTerminal({x:2,y:0})).toBe(true); expect(e.transition({x:1,y:1}, 'RIGHT')).toMatchObject({terminal:true,outcome:'trap',reward:-1}); });
});
describe('QLearningAgent', () => {
  it('applies the terminal update formula', () => { const a = new QLearningAgent(config(), new Random(1)); const u = a.learn({state:{x:0,y:0},action:'RIGHT',nextState:{x:1,y:0},reward:1,terminal:true,outcome:'goal'}); expect(u.newValue).toBeCloseTo(.2); expect(u.nextBestValue).toBe(0); });
  it('with epsilon 0 selects a greedy action', () => { const a = new QLearningAgent(config(0), new Random(1)); a.learn({state:{x:0,y:0},action:'RIGHT',nextState:{x:1,y:0},reward:1,terminal:true,outcome:'goal'}); for(let i=0;i<20;i++) expect(a.selectAction({x:0,y:0}).action).toBe('RIGHT'); });
  it('with epsilon 1 explores all actions', () => { const a = new QLearningAgent(config(1), new Random(7)); const actions = new Set(Array.from({length:100},()=>a.selectAction({x:0,y:0}).action)); expect(actions.size).toBe(4); });
  it('is reproducible with the same seed', () => { const sequence = () => { const a = new QLearningAgent(config(1), new Random(123)); return Array.from({length:30},()=>a.selectAction({x:0,y:0}).action); }; expect(sequence()).toEqual(sequence()); });
});
