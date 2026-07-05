// Roster input: Raid-Helper URL import on top (with ⋮ menu for JSON paste
// imports), manual add below, player list, Export/Clear at the bottom.

import { SPECS, SPEC_IDS } from '../specs.js';
import { specIconHtml } from './specIcon.js';
import { t } from '../i18n/index.js';

export function renderRosterEditor(container, state, actions) {
  container.innerHTML = '';

  const capacity = state.mode;
  const header = document.createElement('div');
  header.className = 'roster-header';
  header.innerHTML = `<h2>${t('roster.title')} <span class="muted">(${state.roster.length}/${capacity})</span></h2>`;

  const modeToggle = document.createElement('div');
  modeToggle.className = 'mode-toggle';
  for (const m of [10, 25]) {
    const btn = document.createElement('button');
    btn.textContent = t(`roster.mode${m}`);
    btn.className = state.mode === m ? 'active' : '';
    btn.onclick = () => actions.setMode(m);
    modeToggle.appendChild(btn);
  }
  header.appendChild(modeToggle);
  container.appendChild(header);

  container.appendChild(divider());

  // --- Raid-Helper import (always visible) ---
  const rhRow = document.createElement('div');
  rhRow.className = 'add-row rh-row';
  const urlInput = document.createElement('input');
  urlInput.placeholder = t('rh.placeholder');
  urlInput.value = state.rhUrl ?? '';
  urlInput.oninput = () => (state.rhUrl = urlInput.value);
  const loadBtn = document.createElement('button');
  loadBtn.className = 'primary';
  loadBtn.textContent = state.rhLoading ? t('rh.loading') : t('rh.load');
  loadBtn.disabled = state.rhLoading;
  const load = () => actions.importRaidHelperUrl(urlInput.value);
  loadBtn.onclick = load;
  urlInput.onkeydown = (e) => {
    if (e.key === 'Enter') load();
  };

  // ⋮ menu with paste-import options
  const menuWrap = document.createElement('div');
  menuWrap.className = 'menu-wrap';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'menu-btn';
  menuBtn.title = t('rh.moreOptions');
  menuBtn.textContent = '⋮';
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    actions.toggleMenu();
  };
  menuWrap.appendChild(menuBtn);
  if (state.menuOpen) {
    const menu = document.createElement('div');
    menu.className = 'menu';
    for (const [label, type] of [
      [t('rh.menuImportRh'), 'import-rh'],
      [t('rh.menuImportTbcrco'), 'import-tbcrco'],
    ]) {
      const item = document.createElement('button');
      item.className = 'menu-item';
      item.textContent = label;
      item.onclick = () => actions.openModal(type);
      menu.appendChild(item);
    }
    menuWrap.appendChild(menu);
  }

  rhRow.append(urlInput, loadBtn, menuWrap);
  container.appendChild(rhRow);

  if (state.rhStatus) {
    const status = document.createElement('p');
    status.className = (state.rhStatus.error ? 'warning' : 'muted') + ' small import-status';
    status.textContent = state.rhStatus.message;
    container.appendChild(status);
  }

  if (state.roster.length > capacity) {
    const warn = document.createElement('p');
    warn.className = 'warning';
    warn.textContent = t('roster.overCapacity', { capacity, excess: state.roster.length - capacity });
    container.appendChild(warn);
  }

  container.appendChild(divider());

  // --- manual add ---
  // Custom dropdown: native <select> can't render icons in options.
  const addRow = document.createElement('div');
  addRow.className = 'add-row';

  const selectedSpec = state.addSpec ?? SPEC_IDS[0];
  const ddWrap = document.createElement('div');
  ddWrap.className = 'spec-dd';
  const ddBtn = document.createElement('button');
  ddBtn.className = 'spec-dd-btn';
  ddBtn.innerHTML =
    specIconHtml(selectedSpec) +
    `<span class="spec-dd-label">${SPECS[selectedSpec].label}</span>` +
    `<span class="muted">▾</span>`;
  ddBtn.onclick = (e) => {
    e.stopPropagation();
    actions.toggleSpecDropdown();
  };
  ddWrap.appendChild(ddBtn);

  if (state.specDdOpen) {
    const menu = document.createElement('div');
    menu.className = 'menu spec-dd-menu';
    let lastClass = null;
    // group specs by class (order of first appearance), separator between classes
    const byClass = new Map();
    for (const id of SPEC_IDS) {
      const cls = SPECS[id].class;
      if (!byClass.has(cls)) byClass.set(cls, []);
      byClass.get(cls).push(id);
    }
    for (const [cls, ids] of byClass) {
      if (lastClass !== null) {
        const sep = document.createElement('div');
        sep.className = 'spec-dd-sep';
        menu.appendChild(sep);
      }
      lastClass = cls;
      for (const id of ids) {
        const item = document.createElement('button');
        item.className = 'menu-item spec-dd-item' + (id === selectedSpec ? ' selected' : '');
        item.innerHTML = specIconHtml(id) + `<span>${SPECS[id].label}</span>`;
        item.onclick = () => actions.setAddSpec(id);
        menu.appendChild(item);
      }
    }
    ddWrap.appendChild(menu);
  }

  const nameInput = document.createElement('input');
  nameInput.placeholder = t('add.namePlaceholder');
  nameInput.maxLength = 20;
  const addBtn = document.createElement('button');
  addBtn.textContent = t('add.button');
  addBtn.className = 'primary';
  const add = () => {
    actions.addPlayer(selectedSpec, nameInput.value.trim());
    nameInput.value = '';
  };
  addBtn.onclick = add;
  nameInput.onkeydown = (e) => {
    if (e.key === 'Enter') add();
  };
  addRow.append(ddWrap, nameInput, addBtn);
  container.appendChild(addRow);

  // --- player list ---
  const list = document.createElement('ul');
  list.className = 'player-list';
  state.roster.forEach((pl) => {
    const spec = SPECS[pl.spec];
    const li = document.createElement('li');
    li.innerHTML =
      specIconHtml(pl.spec) +
      `<span class="player-name">${escapeHtml(pl.name || spec.label)}</span>` +
      (pl.name ? `<span class="muted">${spec.label}</span>` : '') +
      `<span class="role-tag role-${spec.role}">${t('role.' + spec.role)}</span>`;
    const rm = document.createElement('button');
    rm.textContent = '×';
    rm.className = 'remove';
    rm.title = t('remove.title');
    rm.onclick = () => actions.removePlayer(pl.id);
    li.appendChild(rm);
    list.appendChild(li);
  });
  container.appendChild(list);

  // --- bottom tools ---
  const tools = document.createElement('div');
  tools.className = 'roster-tools';
  const optionsBtn = document.createElement('button');
  optionsBtn.textContent = t('tools.options');
  optionsBtn.onclick = () => actions.openModal('options');
  const exportBtn = document.createElement('button');
  exportBtn.textContent = t('tools.export');
  exportBtn.onclick = () => actions.openModal('export');
  const clearBtn = document.createElement('button');
  clearBtn.textContent = t('tools.clear');
  clearBtn.onclick = actions.clearRoster;
  tools.append(optionsBtn, exportBtn, clearBtn);
  container.appendChild(tools);
}

function divider() {
  const hr = document.createElement('hr');
  hr.className = 'roster-divider';
  return hr;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
