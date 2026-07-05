// Modal dialogs: JSON paste imports (Raid-Helper / TBCRCO) and Export
// (share link + TBCRCO JSON with download).

import { buildTbcrcoJson } from '../share.js';
import { BUFFS, DEFAULT_VALUES } from '../buffs.js';
import { buffIconHtml, buffName } from './buffIcon.js';
import { t } from '../i18n/index.js';

export function renderModal(state, actions) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => {
    if (e.target === overlay) actions.closeModal();
  };

  const modal = document.createElement('div');
  modal.className = 'modal';
  overlay.appendChild(modal);

  const head = document.createElement('div');
  head.className = 'modal-head';
  const title = document.createElement('h3');
  title.textContent = {
    'import-rh': t('modal.importRh'),
    'import-tbcrco': t('modal.importTbcrco'),
    export: t('modal.export'),
    options: t('modal.options'),
  }[state.modal];
  const closeBtn = document.createElement('button');
  closeBtn.className = 'remove modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = actions.closeModal;
  head.append(title, closeBtn);
  modal.appendChild(head);

  if (state.modal === 'export') {
    renderExport(modal, state);
  } else if (state.modal === 'options') {
    renderOptions(modal, state, actions);
  } else {
    renderPasteImport(modal, state, actions);
  }

  return overlay;
}

function renderOptions(modal, state, actions) {
  const hint = document.createElement('p');
  hint.className = 'muted small';
  hint.textContent = t('options.hint');
  modal.appendChild(hint);

  for (const scope of ['party', 'raid']) {
    const h = document.createElement('h4');
    h.textContent = scope === 'party' ? t('options.party') : t('options.raid');
    modal.appendChild(h);
    const list = document.createElement('div');
    list.className = 'options-list';
    for (const [id, buff] of Object.entries(BUFFS)) {
      if (buff.scope !== scope) continue;
      const row = document.createElement('label');
      row.className = 'options-row';
      row.innerHTML =
        buffIconHtml(id) +
        `<span class="options-label">${buffName(id)}</span>` +
        (state.weights[id] !== undefined ? `<span class="muted small">${t('options.default', { value: DEFAULT_VALUES[id] })}</span>` : '');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '0.5';
      input.value = state.weights[id] ?? DEFAULT_VALUES[id];
      // onchange (not oninput): commits on blur/Enter, so the re-render
      // doesn't steal focus mid-typing.
      input.onchange = () => {
        const v = parseFloat(input.value);
        actions.setWeight(id, v === DEFAULT_VALUES[id] ? NaN : v);
      };
      row.appendChild(input);
      list.appendChild(row);
    }
    modal.appendChild(list);
  }

  const resetBtn = document.createElement('button');
  resetBtn.textContent = t('options.reset');
  resetBtn.onclick = actions.resetWeights;
  modal.appendChild(resetBtn);
}

function renderPasteImport(modal, state, actions) {
  const hint = document.createElement('p');
  hint.className = 'muted small';
  hint.textContent = state.modal === 'import-rh' ? t('modal.rhHint') : t('modal.tbcrcoHint');
  modal.appendChild(hint);

  const textarea = document.createElement('textarea');
  textarea.rows = 8;
  textarea.placeholder = '{ … }';
  modal.appendChild(textarea);

  if (state.modalError) {
    const err = document.createElement('p');
    err.className = 'warning small';
    err.textContent = state.modalError;
    modal.appendChild(err);
  }

  const importBtn = document.createElement('button');
  importBtn.className = 'primary';
  importBtn.textContent = t('modal.import');
  importBtn.onclick = () =>
    state.modal === 'import-rh'
      ? actions.importRaidHelperJson(textarea.value)
      : actions.importTbcrcoJson(textarea.value);
  modal.appendChild(importBtn);
  textarea.focus();
}

function renderExport(modal, state) {
  // Share link + copy
  const linkLabel = document.createElement('h4');
  linkLabel.textContent = t('modal.shareLink');
  modal.appendChild(linkLabel);

  const linkRow = document.createElement('div');
  linkRow.className = 'share-row';
  const linkInput = document.createElement('input');
  linkInput.readOnly = true;
  linkInput.value = window.location.href;
  linkInput.onfocus = () => linkInput.select();
  const copyBtn = document.createElement('button');
  copyBtn.textContent = t('modal.copy');
  copyBtn.onclick = async () => {
    await navigator.clipboard.writeText(linkInput.value);
    copyBtn.textContent = t('modal.copied');
    setTimeout(() => (copyBtn.textContent = t('modal.copy')), 1500);
  };
  linkRow.append(linkInput, copyBtn);
  modal.appendChild(linkRow);

  modal.appendChild(document.createElement('hr'));

  // TBCRCO JSON + download
  const jsonLabel = document.createElement('h4');
  jsonLabel.textContent = t('modal.tbcrcoJson');
  modal.appendChild(jsonLabel);

  const json = buildTbcrcoJson(state.roster, state.mode);
  const textarea = document.createElement('textarea');
  textarea.rows = 8;
  textarea.readOnly = true;
  textarea.value = json;
  textarea.onfocus = () => textarea.select();
  modal.appendChild(textarea);

  const dlBtn = document.createElement('button');
  dlBtn.className = 'primary';
  dlBtn.textContent = t('modal.download');
  dlBtn.onclick = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'TBCRCO.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  modal.appendChild(dlBtn);
}
