// UI bootstrap: state, worker wiring, rendering.

import { renderRosterEditor } from './ui/RosterEditor.js';
import { renderPartyCard } from './ui/PartyCard.js';
import { renderScorePanel } from './ui/ScorePanel.js';
import { renderModal } from './ui/Modal.js';
import { syncUrl, loadFromUrl, parseJsonImport } from './share.js';
import { t, getLang, setLang, LANGS } from './i18n/index.js';
import { parseEventId, fetchRaidHelperEvent, mapRaidHelperEvent } from './raidhelper.js';

const state = {
  roster: [], // { id, spec, name }
  mode: 25, // 10 or 25 → partyCount 2 or 5
  result: null,
  solving: false,
  progress: null, // { stage, pct } while the worker is running
  error: null,
  // Raid-Helper import
  rhLoading: false,
  rhUrl: '',
  rhStatus: null, // { error: bool, message: string }
  // ⋮ menu + modal dialogs
  menuOpen: false,
  modal: null, // 'import-rh' | 'import-tbcrco' | 'export' | null
  modalError: null,
  // manual-add spec dropdown
  addSpec: null,
  specDdOpen: false,
  // user-tuned buff weights ({ buffId: value }), session-only
  weights: {},
  langMenuOpen: false,
};

const fromUrl = loadFromUrl();
if (fromUrl) {
  state.roster = fromUrl.roster;
  state.mode = fromUrl.mode;
}

// Worker is respawnable: Cancel terminates it mid-solve and starts a fresh
// one (costs the warm WASM instance — the progress bar covers the reload).
let worker;
function createWorker() {
  const w = new Worker(new URL('./solver.worker.js', import.meta.url), { type: 'module' });
  w.onmessage = (e) => {
    if (e.data.progress) {
      state.progress = e.data.progress;
      render();
      return;
    }
    state.solving = false;
    state.progress = null;
    if (e.data.ok) {
      state.result = e.data.result;
      state.error = null;
    } else {
      state.result = null;
      state.error = e.data.error;
    }
    render();
  };
  w.onerror = (e) => {
    state.solving = false;
    state.progress = null;
    state.error = e.message || t('error.worker');
    render();
  };
  return w;
}
worker = createWorker();

let nextId = 1;
const actions = {
  addPlayer(spec, name) {
    // newest on top
    state.roster.unshift({ id: `p${nextId++}`, spec, name });
    onRosterChanged();
  },
  removePlayer(id) {
    state.roster = state.roster.filter((pl) => pl.id !== id);
    onRosterChanged();
  },
  clearRoster() {
    state.roster = [];
    onRosterChanged();
  },
  setMode(mode) {
    state.mode = mode;
    onRosterChanged();
  },
  toggleMenu() {
    state.menuOpen = !state.menuOpen;
    state.specDdOpen = false;
    state.langMenuOpen = false;
    render();
  },
  toggleSpecDropdown() {
    state.specDdOpen = !state.specDdOpen;
    state.menuOpen = false;
    state.langMenuOpen = false;
    render();
  },
  toggleLangMenu() {
    state.langMenuOpen = !state.langMenuOpen;
    state.menuOpen = false;
    state.specDdOpen = false;
    render();
  },
  setLang(lang) {
    setLang(lang);
    state.langMenuOpen = false;
    render();
  },
  setAddSpec(spec) {
    state.addSpec = spec;
    state.specDdOpen = false;
    render();
  },
  openModal(type) {
    state.modal = type;
    state.modalError = null;
    state.menuOpen = false;
    render();
  },
  closeModal() {
    state.modal = null;
    state.modalError = null;
    render();
  },
  importTbcrcoJson(text) {
    if (!text?.trim()) return;
    try {
      const parsed = parseJsonImport(text);
      if (parsed.roster.length === 0) throw new Error('no valid players found');
      state.roster = parsed.roster;
      state.mode = parsed.mode;
      state.modal = null;
      state.rhStatus = { error: false, message: t('rh.importedTbcrco', { count: parsed.roster.length }) };
      state.result = null;
      state.error = null;
      syncUrl(state.roster, state.mode);
      render();
    } catch (err) {
      state.modalError = t('rh.invalidTbcrco', { error: err?.message ?? err });
      render();
    }
  },
  async importRaidHelperUrl(input) {
    const eventId = parseEventId(input ?? '');
    if (!eventId) {
      state.rhStatus = { error: true, message: t('rh.invalidUrl') };
      render();
      return;
    }
    state.rhLoading = true;
    state.rhStatus = null;
    render();
    try {
      const data = await fetchRaidHelperEvent(eventId);
      applyRaidHelperImport(data);
    } catch (err) {
      state.rhStatus = {
        error: true,
        message: t('rh.fetchFailed', { error: err?.message ?? err }),
      };
    } finally {
      state.rhLoading = false;
      render();
    }
  },
  importRaidHelperJson(text) {
    if (!text?.trim()) return;
    try {
      if (!applyRaidHelperImport(JSON.parse(text))) {
        state.modalError = t('rh.noSignups');
      } else {
        state.modal = null;
      }
    } catch (err) {
      state.modalError = t('rh.invalidJson', { error: err?.message ?? err });
    }
    render();
  },
  optimize() {
    if (state.roster.length === 0 || state.roster.length > state.mode) return;
    state.solving = true;
    state.progress = { key: 'progress.starting', pct: 5 };
    state.error = null;
    render();
    worker.postMessage({
      roster: state.roster.map((pl) => ({ ...pl })),
      partyCount: state.mode === 10 ? 2 : 5,
      weights: { ...state.weights },
    });
  },
  setWeight(buffId, value) {
    if (Number.isFinite(value) && value >= 0) {
      state.weights[buffId] = value;
    } else {
      delete state.weights[buffId];
    }
    state.result = null; // stale — weights changed
    render();
  },
  resetWeights() {
    state.weights = {};
    state.result = null;
    render();
  },
  cancelSolve() {
    worker.terminate();
    worker = createWorker();
    state.solving = false;
    state.progress = null;
    render();
  },
};

// Replaces the roster with mapped Raid-Helper sign-ups and reports skips.
// Auto-picks 10/25 mode from the imported size.
function applyRaidHelperImport(data) {
  const { roster, skipped, title } = mapRaidHelperEvent(data);
  if (roster.length === 0) {
    state.rhStatus = { error: true, message: t('rh.noSignups') };
    return false;
  }
  state.roster = roster;
  state.mode = roster.length > 10 ? 25 : 10;
  const parts = [t('rh.imported', { count: roster.length, title: title ? ` (“${title}”)` : '' })];
  if (skipped.length > 0) parts.push(t('rh.skipped', { list: skipped.join(', ') }));
  state.rhStatus = { error: false, message: parts.join(' ') };
  syncUrl(state.roster, state.mode);
  state.result = null;
  state.error = null;
  return true;
}

function onRosterChanged() {
  state.result = null; // stale layout — force re-optimize
  state.error = null;
  syncUrl(state.roster, state.mode);
  render();
}

const app = document.getElementById('app');

// Close open popups on outside click / Escape.
document.addEventListener('click', () => {
  if (state.menuOpen || state.specDdOpen || state.langMenuOpen) {
    state.menuOpen = false;
    state.specDdOpen = false;
    state.langMenuOpen = false;
    render();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (state.modal || state.menuOpen || state.specDdOpen || state.langMenuOpen) {
    state.modal = null;
    state.modalError = null;
    state.menuOpen = false;
    state.specDdOpen = false;
    state.langMenuOpen = false;
    render();
  }
});

function render() {
  app.innerHTML = `
    <header class="app-header">
      <div class="app-header-text">
        <h1>${t('app.title')}</h1>
        <p class="muted">${t('app.subtitle')}</p>
      </div>
      <div class="menu-wrap lang-wrap"></div>
    </header>
    <div class="layout">
      <aside id="roster-pane"></aside>
      <main id="result-pane"></main>
    </div>
  `;

  // language switcher (top right)
  const langWrap = app.querySelector('.lang-wrap');
  const langBtn = document.createElement('button');
  langBtn.className = 'lang-btn';
  langBtn.textContent = getLang().toUpperCase() + ' ▾';
  langBtn.onclick = (e) => {
    e.stopPropagation();
    actions.toggleLangMenu();
  };
  langWrap.appendChild(langBtn);
  if (state.langMenuOpen) {
    const menu = document.createElement('div');
    menu.className = 'menu';
    for (const [code, lang] of Object.entries(LANGS)) {
      const item = document.createElement('button');
      item.className = 'menu-item' + (code === getLang() ? ' selected' : '');
      item.textContent = lang.name;
      item.onclick = () => actions.setLang(code);
      menu.appendChild(item);
    }
    langWrap.appendChild(menu);
  }

  const rosterPane = document.getElementById('roster-pane');
  renderRosterEditor(rosterPane, state, actions);

  const makeOptimizeBtn = () => {
    const btn = document.createElement('button');
    btn.className = 'primary optimize';
    btn.textContent = state.solving ? t('optimize.solving') : t('optimize.button');
    btn.disabled =
      state.solving || state.roster.length === 0 || state.roster.length > state.mode;
    btn.onclick = actions.optimize;
    return btn;
  };
  rosterPane.appendChild(makeOptimizeBtn());

  const resultPane = document.getElementById('result-pane');
  if (state.error) {
    const err = document.createElement('p');
    err.className = 'warning';
    err.textContent = state.error;
    resultPane.appendChild(err);
  }
  if (state.solving && state.progress) {
    // Progress lives where the party layout will appear — centrally visible.
    const wrap = document.createElement('div');
    wrap.className = 'progress-wrap center-block';
    wrap.innerHTML =
      `<div class="progress-track"><div class="progress-fill" style="width:${state.progress.pct}%"></div></div>` +
      `<p class="muted small progress-stage">${t(state.progress.key, state.progress.params)}</p>`;
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = t('optimize.cancel');
    cancelBtn.onclick = actions.cancelSolve;
    wrap.appendChild(cancelBtn);
    resultPane.appendChild(wrap);
  } else if (state.result) {
    const grid = document.createElement('div');
    grid.className = 'party-grid';
    state.result.parties.forEach((party, i) => grid.appendChild(renderPartyCard(party, i)));
    resultPane.appendChild(grid);
    resultPane.appendChild(renderScorePanel(state.result));
  } else if (!state.error) {
    // Empty state (e.g. someone opened a share link): hint + its own
    // Optimize button, front and center.
    const empty = document.createElement('div');
    empty.className = 'empty-hint center-block';
    const hint = document.createElement('p');
    hint.className = 'muted';
    hint.textContent = state.roster.length === 0 ? t('hint.empty') : t('hint.ready');
    empty.appendChild(hint);
    empty.appendChild(makeOptimizeBtn());
    resultPane.appendChild(empty);
  }

  if (state.modal) app.appendChild(renderModal(state, actions));
}

render();
