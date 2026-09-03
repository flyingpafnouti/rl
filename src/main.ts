import './styles/main.css';
import { Environment } from './rl/Environment';
import { Random } from './rl/Random';
import type { CellType, QLearningUpdate } from './rl/types';
import { AppState } from './state/appState';
import { defaultConfig, environments, learningPresets } from './presets/presets';
import { gridSvg } from './ui/GridView';
import { chartSvg } from './ui/Charts';

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('App root not found');
const root: HTMLDivElement = rootElement;
const app = new AppState();
let runToken = 0;

const fmt = (n: number, digits = 3): string => Number.isFinite(n) ? n.toFixed(digits) : '—';
const range = (id: string, label: string, value: number, min: number, max: number, step: number, hint = ''): string => `
  <label class="field" for="${id}"><span>${label}${hint ? `<button class="hint" type="button" title="${hint}" aria-label="Aide : ${label}">?</button>` : ''}<output id="${id}-out">${value}</output></span>
  <input id="${id}" data-config="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;

function configPanel(): string {
  const c = app.config;
  return `<section class="card controls-card"><div class="section-title"><div><p class="eyebrow">Laboratoire</p><h2>Paramètres</h2></div><select id="theme" aria-label="Thème"><option value="system">Système</option><option value="light">Clair</option><option value="dark">Sombre</option></select></div>
    ${range('alpha', 'Learning rate α', c.alpha, .01, 1, .01, 'Poids donné à la nouvelle expérience.')}
    ${range('gamma', 'Discount factor γ', c.gamma, 0, 1, .01, 'Importance des récompenses futures.')}
    ${range('epsilon', 'Exploration ε', c.epsilon, 0, 1, .01, 'Probabilité de choisir une action aléatoire.')}
    <div class="two-cols">${range('epsilonMin', 'ε minimum', c.epsilonMin, 0, 1, .01)}${range('epsilonDecay', 'ε decay', c.epsilonDecay, .9, 1, .001)}</div>
    <label class="check"><input id="decayEnabled" type="checkbox" ${c.decayEnabled ? 'checked' : ''}> Réduire ε après chaque épisode</label>
    <h3>Récompenses</h3><div class="three-cols">
      <label>Objectif<input id="rewardGoal" type="number" step=".1" value="${c.rewards.goal}"></label>
      <label>Piège<input id="rewardTrap" type="number" step=".1" value="${c.rewards.trap}"></label>
      <label>Pas<input id="rewardStep" type="number" step=".01" value="${c.rewards.step}"></label>
    </div><label>Pas max. / épisode<input id="maxSteps" type="number" min="1" max="10000" value="${c.maxSteps}"></label>
    <div id="parameter-hint" class="context-hint" aria-live="polite">Modifiez un paramètre pour observer son effet.</div>
  </section>`;
}

function statsHtml(): string {
  const h = app.trainer.history, last = h.at(-1), avg = h.length ? h.reduce((s, e) => s + e.reward, 0) / h.length : 0;
  const recent = h.slice(-100), success = recent.length ? recent.filter(e => e.success).length / recent.length * 100 : 0;
  const best = h.length ? Math.max(...h.map(e => e.reward)) : 0;
  const items = [['Épisodes', app.trainer.episodes.toLocaleString('fr-FR')], ['Epsilon actuel', fmt(app.config.epsilon)], ['Dernière récompense', last ? fmt(last.reward) : '—'], ['Récompense moyenne', h.length ? fmt(avg) : '—'], ['Meilleure récompense', h.length ? fmt(best) : '—'], ['Pas du dernier épisode', last?.steps ?? '—'], ['Succès · 100 derniers', `${fmt(success, 1)} %`], ['Pas environnement', app.trainer.totalSteps.toLocaleString('fr-FR')]];
  return items.map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function explanation(u: QLearningUpdate | null): string {
  if (!u) return `<div class="empty-update"><span>∑</span><p>Utilisez <strong>Step</strong> pour décomposer exactement la prochaine mise à jour Q-learning.</p></div>`;
  const term = u.terminal;
  return `<div class="update-grid">
    <div><span>État</span><strong>(${u.state.x}, ${u.state.y})</strong></div><div><span>Action</span><strong>${u.action} · ${u.explored ? 'exploration' : 'exploitation'}</strong></div><div><span>Récompense</span><strong>${fmt(u.reward)}</strong></div><div><span>État suivant</span><strong>(${u.nextState.x}, ${u.nextState.y})${term ? ' · terminal' : ''}</strong></div>
  </div><div class="calculation"><p>Target = ${term ? `${fmt(u.reward)}` : `${fmt(u.reward)} + ${fmt(u.gamma)} × ${fmt(u.nextBestValue)}`} = <strong>${fmt(u.target, 4)}</strong></p>
  <p>Mise à jour = ${fmt(u.oldValue)} + ${fmt(u.alpha)} × (${fmt(u.target, 4)} − ${fmt(u.oldValue)})</p>
  <div class="q-change"><span>${fmt(u.oldValue)}</span><b>→</b><strong>${fmt(u.newValue)}</strong></div></div>`;
}

function render(): void {
  root.innerHTML = `<header class="topbar"><div><p class="eyebrow">APPRENTISSAGE PAR RENFORCEMENT</p><h1>RL Playground</h1><p class="subtitle">Voyez une politique émerger, une décision après l’autre.</p></div><div class="status ${app.running ? 'live' : ''}"><i></i>${app.running ? 'En apprentissage' : 'En pause'}</div></header>
  <main><div class="workspace"><section class="card grid-card"><div class="section-title"><div><p class="eyebrow">ENVIRONNEMENT</p><h2>${app.environmentName}</h2></div><div class="view-toggles"><label class="check"><input id="showQ" type="checkbox" ${app.showQ ? 'checked' : ''}> Q-values</label><label class="check"><input id="policyOnly" type="checkbox" ${app.policyOnly ? 'checked' : ''}> Politique seule</label></div></div>
    <div class="grid-wrap">${gridSvg(app)}</div><div class="legend"><span><i class="start"></i>Départ</span><span><i class="goal"></i>Objectif</span><span><i class="trap"></i>Piège</span><span><i class="wall"></i>Mur</span><span><i class="dot"></i>Agent</span></div>
    <div class="editor"><button id="toggleEdit" class="secondary" type="button">${app.editing ? 'Terminer l’édition' : 'Modifier la grille'}</button><div class="brushes ${app.editing ? '' : 'hidden'}" role="group" aria-label="Type de cellule">${(['free','wall','start','goal','trap'] as CellType[]).map(t => `<button data-brush="${t}" class="brush ${app.brush === t ? 'active' : ''}" type="button">${{free:'Libre',wall:'Mur',start:'Départ',goal:'Objectif',trap:'Piège'}[t]}</button>`).join('')}</div></div></section>${configPanel()}</div>
  <section class="card training"><div class="section-title"><div><p class="eyebrow">ENTRAÎNEMENT</p><h2>Piloter l’agent</h2></div><div class="mode-tabs"><button data-mode="observer" class="${app.mode === 'observer' ? 'active' : ''}">Observer</button><button data-mode="turbo" class="${app.mode === 'turbo' ? 'active' : ''}">Turbo</button></div></div>
    <div class="training-row"><div class="button-row"><button id="train" class="primary">▶ Train</button><button id="pause" class="secondary">Pause</button><button id="step" class="secondary">Step</button><button data-episodes="1" class="secondary">1 épisode</button><button data-episodes="100" class="secondary">100 épisodes</button><button data-episodes="1000" class="secondary">1 000 épisodes</button></div>
    <label class="speed">Vitesse <input id="speed" type="range" min="1" max="10" value="${app.speed}"><output>${app.speed}×</output></label></div>
    <div class="seed-row"><label>Random seed <input id="seed" type="number" value="${app.seed}"></label><button id="newSeed" class="ghost">New seed</button><button id="resetLearning" class="ghost danger">Reset Learning</button><button id="resetAll" class="ghost danger">Reset All</button></div>
    <div class="stats">${statsHtml()}</div></section>
  <section class="card presets"><div><p class="eyebrow">EXPÉRIENCES GUIDÉES</p><h2>Presets pédagogiques</h2><p id="preset-description">${app.presetDescription}</p></div><div class="preset-buttons">${Object.keys(learningPresets).map(name => `<button data-preset="${name}" class="secondary">${name}</button>`).join('')}</div><label>Environnement<select id="environment">${Object.keys(environments).map(name => `<option ${name === app.environmentName ? 'selected' : ''}>${name}</option>`).join('')}</select></label></section>
  <div class="charts"><section class="card"><div class="chart-title"><div><p class="eyebrow">CONVERGENCE</p><h2>Récompense par épisode</h2></div><span><i></i>brut <i class="avg"></i>moyenne · 20</span></div>${chartSvg(app.trainer.history, 'reward')}</section><section class="card"><div class="chart-title"><div><p class="eyebrow">EFFICACITÉ</p><h2>Pas par épisode</h2></div></div>${chartSvg(app.trainer.history, 'steps')}</section></div>
  <section class="card update"><div><p class="eyebrow">SOUS LE CAPOT</p><h2>Dernière mise à jour Q-learning</h2></div>${explanation(app.trainer.lastUpdate)}</section>
  <section class="card learn"><p class="eyebrow">CE QUE VOUS OBSERVEZ</p><h2>Lire l’apprentissage</h2><div class="learn-grid"><article><b>Q-value</b><p>Une estimation de la valeur d’une action dans une case. Plus elle est grande, plus l’action semble prometteuse.</p></article><article><b>Politique</b><p>La meilleure flèche de chaque case forme la stratégie greedy connue à cet instant.</p></article><article><b>Exploration / exploitation</b><p>Avec une probabilité ε, l’agent essaie au hasard. Sinon, il suit une de ses meilleures actions.</p></article><article><b>Alpha · α</b><p>Contrôle la force avec laquelle une nouvelle expérience corrige une ancienne estimation.</p></article><article><b>Gamma · γ</b><p>Détermine combien les récompenses futures influencent une décision présente.</p></article><article><b>Epsilon · ε</b><p>Plus ε est haut, plus l’agent explore — utile pour découvrir, moins stable pour agir.</p></article></div></section></main><footer>RL Playground · Q-learning tabulaire, calculé entièrement dans votre navigateur</footer>`;
  applyTheme(); bindEvents();
}

function syncConfig(): void {
  const num = (id: string): number => Number((document.querySelector<HTMLInputElement>(`#${id}`))?.value);
  app.config.alpha = num('alpha'); app.config.gamma = num('gamma'); app.config.epsilon = num('epsilon'); app.config.epsilonMin = num('epsilonMin'); app.config.epsilonDecay = num('epsilonDecay');
  app.config.decayEnabled = document.querySelector<HTMLInputElement>('#decayEnabled')?.checked ?? true; app.config.maxSteps = Math.max(1, num('maxSteps'));
  app.config.rewards = { goal: num('rewardGoal'), trap: num('rewardTrap'), step: num('rewardStep') }; app.environment.setRewards(app.config.rewards); app.agent.setConfig(app.config);
}
function stop(): void { app.running = false; runToken++; }
function renderAndStop(): void { stop(); render(); }
function contextual(id: string, value: number): string {
  if (id === 'gamma' && value < .4) return 'L’agent devient plus myope : les récompenses lointaines comptent moins.';
  if (id === 'epsilon' && value > .5) return 'L’agent explore davantage et suit moins souvent sa meilleure politique connue.';
  if (id === 'alpha' && value > .7) return 'Les nouvelles expériences modifient fortement les Q-values : apprentissage rapide, parfois instable.';
  return 'La modification s’applique dès la prochaine décision.';
}
function bindEvents(): void {
  document.querySelectorAll<HTMLInputElement>('[data-config]').forEach(input => input.addEventListener('input', () => {
    const output = document.querySelector<HTMLOutputElement>(`#${input.id}-out`); if (output) output.value = input.value;
    syncConfig(); const hint = document.querySelector('#parameter-hint'); if (hint) hint.textContent = contextual(input.id, Number(input.value));
  }));
  ['decayEnabled','rewardGoal','rewardTrap','rewardStep','maxSteps'].forEach(id => document.querySelector(`#${id}`)?.addEventListener('change', syncConfig));
  document.querySelector('#showQ')?.addEventListener('change', e => { app.showQ = (e.target as HTMLInputElement).checked; renderAndStop(); });
  document.querySelector('#policyOnly')?.addEventListener('change', e => { app.policyOnly = (e.target as HTMLInputElement).checked; app.showQ = true; renderAndStop(); });
  document.querySelector('#speed')?.addEventListener('input', e => { app.speed = Number((e.target as HTMLInputElement).value); const o = document.querySelector('.speed output'); if (o) o.textContent = `${app.speed}×`; });
  document.querySelector('#train')?.addEventListener('click', () => startTraining()); document.querySelector('#pause')?.addEventListener('click', renderAndStop);
  document.querySelector('#step')?.addEventListener('click', () => { stop(); syncConfig(); app.trainer.step(); render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-episodes]').forEach(b => b.addEventListener('click', () => runEpisodes(Number(b.dataset.episodes))));
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.addEventListener('click', () => { app.mode = b.dataset.mode as AppState['mode']; renderAndStop(); }));
  document.querySelector('#resetLearning')?.addEventListener('click', () => { stop(); app.resetLearning(); render(); });
  document.querySelector('#resetAll')?.addEventListener('click', () => { stop(); Object.assign(app.config, defaultConfig()); app.seed = 42; app.environmentName = 'Easy'; app.presetDescription = learningPresets.Balanced.description; app.rebuild(new Environment(environments.Easy, app.config.rewards)); render(); });
  document.querySelector('#newSeed')?.addEventListener('click', () => { app.seed = Math.floor(Math.random() * 2 ** 31); app.agent.setRandom(new Random(app.seed)); renderAndStop(); });
  document.querySelector('#seed')?.addEventListener('change', e => { app.seed = Number((e.target as HTMLInputElement).value) >>> 0; app.agent.setRandom(new Random(app.seed)); });
  document.querySelector('#toggleEdit')?.addEventListener('click', () => { app.editing = !app.editing; renderAndStop(); });
  document.querySelectorAll<HTMLButtonElement>('[data-brush]').forEach(b => b.addEventListener('click', () => { app.brush = b.dataset.brush as CellType; render(); }));
  document.querySelectorAll<SVGGElement>('[data-cell]').forEach(cell => { const edit = () => editCell(Number(cell.dataset.cell)); cell.addEventListener('click', edit); cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') edit(); }); });
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset ?? 'Balanced')));
  document.querySelector<HTMLSelectElement>('#environment')?.addEventListener('change', e => loadEnvironment((e.target as HTMLSelectElement).value as keyof typeof environments));
  const theme = document.querySelector<HTMLSelectElement>('#theme'); if (theme) { theme.value = app.theme; theme.addEventListener('change', () => { app.theme = theme.value as AppState['theme']; applyTheme(); }); }
}

function editCell(index: number): void {
  if (!app.editing) return; const state = { x: index % app.environment.width, y: Math.floor(index / app.environment.width) };
  try { app.environment.setCell(state, app.brush); app.environmentName = 'Grille personnalisée'; app.rebuild(app.environment); render(); }
  catch (error) { window.alert(error instanceof Error ? error.message : 'Modification impossible'); }
}
function loadEnvironment(name: keyof typeof environments): void { stop(); app.environmentName = name; app.rebuild(new Environment(environments[name], app.config.rewards)); render(); }
function applyPreset(name: string): void {
  stop(); const preset = learningPresets[name]; const fresh = defaultConfig(); Object.assign(fresh, preset.patch); app.config = fresh; app.environmentName = preset.environment;
  app.presetDescription = preset.description; app.environment = new Environment(environments[preset.environment], app.config.rewards); app.agent.setConfig(app.config); app.rebuild(app.environment); render();
}
function applyTheme(): void { document.documentElement.dataset.theme = app.theme; }
function startTraining(): void {
  if (app.running) return; syncConfig(); app.running = true; const token = ++runToken; render();
  if (app.mode === 'turbo') turboLoop(token); else observerLoop(token);
}
function observerLoop(token: number): void {
  if (!app.running || token !== runToken) return; app.trainer.step(); render(); app.running = true;
  window.setTimeout(() => observerLoop(token), Math.max(30, 700 / app.speed));
}
function turboLoop(token: number): void {
  if (!app.running || token !== runToken) return; const start = performance.now();
  while (performance.now() - start < 12) app.trainer.runEpisode(); render(); app.running = true; requestAnimationFrame(() => turboLoop(token));
}
function runEpisodes(count: number): void {
  stop(); syncConfig(); app.running = true; const token = ++runToken; let remaining = count;
  const batch = (): void => { if (token !== runToken) return; const start = performance.now(); while (remaining > 0 && performance.now() - start < 12) { app.trainer.runEpisode(); remaining--; }
    if (remaining > 0) requestAnimationFrame(batch); else { app.running = false; render(); }
  }; requestAnimationFrame(batch); render(); app.running = true;
}

render();
