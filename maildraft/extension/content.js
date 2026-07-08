// MailDraft content script — injected into Gmail

let sidebarInjected = false;
let currentTemplates = [];
let authToken = null;
let appUrl = 'http://localhost:3000';

// Security: only allow HTTPS app URLs in production (allow localhost for dev)
function isSafeAppUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

// Load config via background script (not directly from storage in content scripts)
chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
  if (response) authToken = response.token;
});

chrome.storage.sync.get(['maildraft_app_url'], (result) => {
  const url = result.maildraft_app_url || 'http://localhost:3000';
  appUrl = isSafeAppUrl(url) ? url : 'http://localhost:3000';
});

// Watch for compose window opening
const observer = new MutationObserver(() => {
  injectMailDraftButton();
});

observer.observe(document.body, { childList: true, subtree: true });

function injectMailDraftButton() {
  // Gmail compose toolbar selector (stable role-based)
  const composeWindows = document.querySelectorAll('div[role="dialog"]');

  composeWindows.forEach(win => {
    if (win.dataset.maildraftInjected) return;

    // Find the send button area / toolbar
    const toolbar = win.querySelector('div.btC') || win.querySelector('div[data-tooltip="Send"]')?.closest('div');
    if (!toolbar) return;

    win.dataset.maildraftInjected = 'true';

    const btn = document.createElement('button');
    btn.id = 'maildraft-btn';
    btn.setAttribute('data-compose-win', 'true');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      MailDraft
    `;
    btn.title = 'Insert email template';
    btn.addEventListener('click', () => openSidebar(win));

    toolbar.appendChild(btn);
  });
}

async function openSidebar(composeWin) {
  if (!sidebarInjected) {
    createSidebar();
    sidebarInjected = true;
  }

  const sidebar = document.getElementById('maildraft-sidebar');
  sidebar.classList.add('open');
  sidebar.dataset.composeTarget = 'active';

  // Store reference to compose window
  window._maildraftComposeWin = composeWin;

  await loadTemplates();
}

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'maildraft-sidebar';
  sidebar.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; border-bottom:1px solid #e5e7eb; background:#f8fafc;">
      <div style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:15px;">
        <div style="background:#2563eb; color:white; width:24px; height:24px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">M</div>
        MailDraft
      </div>
      <button id="maildraft-close" style="background:none; border:none; cursor:pointer; font-size:18px; color:#6b7280;">✕</button>
    </div>

    <div id="maildraft-content" style="flex:1; overflow-y:auto; padding:16px;">
      <div id="maildraft-loading" style="text-align:center; color:#6b7280; padding:24px;">
        Loading templates...
      </div>
      <div id="maildraft-templates" style="display:none;"></div>
      <div id="maildraft-builder" style="display:none;"></div>
    </div>

    <div id="maildraft-footer" style="padding:16px; border-top:1px solid #e5e7eb; display:none;">
      <button id="maildraft-insert" style="width:100%; padding:10px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500;">
        ✅ Insert in email
      </button>
    </div>
  `;
  document.body.appendChild(sidebar);

  document.getElementById('maildraft-close').addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  document.getElementById('maildraft-insert').addEventListener('click', insertEmail);
}

async function loadTemplates() {
  const loadingEl = document.getElementById('maildraft-loading');
  const templatesEl = document.getElementById('maildraft-templates');
  const builderEl = document.getElementById('maildraft-builder');

  loadingEl.style.display = 'block';
  templatesEl.style.display = 'none';
  builderEl.style.display = 'none';

  if (!authToken) {
    loadingEl.innerHTML = `
      <p style="color:#dc2626;">Not signed in.</p>
      <a href="${appUrl}/login" target="_blank" style="color:#2563eb;">Sign in to MailDraft</a>
      <p style="margin-top:8px; font-size:12px; color:#6b7280;">Then configure the extension popup.</p>
    `;
    return;
  }

  try {
    const res = await fetch(`${appUrl}/api/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) throw new Error('Failed to load');
    currentTemplates = await res.json();

    renderTemplateList();
  } catch (err) {
    loadingEl.innerHTML = `<p style="color:#dc2626;">Could not load templates. Check connection.</p>`;
  }
}

function renderTemplateList() {
  const loadingEl = document.getElementById('maildraft-loading');
  const templatesEl = document.getElementById('maildraft-templates');

  loadingEl.style.display = 'none';
  templatesEl.style.display = 'block';

  if (currentTemplates.length === 0) {
    templatesEl.innerHTML = `<p style="color:#6b7280; text-align:center;">No templates yet. Create one in the dashboard.</p>`;
    return;
  }

  templatesEl.innerHTML = `
    <p style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">Templates</p>
    ${currentTemplates.map(t => `
      <div class="maildraft-template-item" data-id="${t.id}" style="padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; cursor:pointer; transition:background 0.1s;">
        <div style="font-weight:500; font-size:13px;">${escapeHtml(t.name)}</div>
        ${t.description ? `<div style="font-size:11px; color:#6b7280; margin-top:2px;">${escapeHtml(t.description)}</div>` : ''}
        <div style="font-size:11px; color:#9ca3af; margin-top:4px;">${(t.template_blocks || []).length} block(s)</div>
      </div>
    `).join('')}
  `;

  templatesEl.querySelectorAll('.maildraft-template-item').forEach(el => {
    el.addEventListener('mouseenter', () => { el.style.background = '#f0f9ff'; });
    el.addEventListener('mouseleave', () => { el.style.background = ''; });
    el.addEventListener('click', () => {
      const template = currentTemplates.find(t => t.id === el.dataset.id);
      if (template) openTemplateBuilder(template);
    });
  });
}

let selectedOptionsByBlock = {};
let manualVariableValues = {};
let currentTemplate = null;

function openTemplateBuilder(template) {
  currentTemplate = template;
  selectedOptionsByBlock = {};
  manualVariableValues = {};

  const templatesEl = document.getElementById('maildraft-templates');
  const builderEl = document.getElementById('maildraft-builder');
  const footerEl = document.getElementById('maildraft-footer');

  templatesEl.style.display = 'none';
  builderEl.style.display = 'block';
  footerEl.style.display = 'block';

  const blocks = (template.template_blocks || []).sort((a, b) => a.position - b.position);
  const variables = template.template_variables || [];
  const manualVars = variables.filter(v => v.auto_fill_type === 'manual' || v.auto_fill_type === 'custom');

  // Set default selections (first option for each block)
  blocks.forEach(block => {
    const opts = (block.block_options || []).sort((a, b) => a.position - b.position);
    if (opts.length > 0) selectedOptionsByBlock[block.id] = opts[0].id;
  });

  builderEl.innerHTML = `
    <button id="maildraft-back" style="background:none; border:none; cursor:pointer; color:#2563eb; font-size:13px; margin-bottom:16px; padding:0; display:flex; align-items:center; gap:4px;">
      ← Back to templates
    </button>

    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">${escapeHtml(template.name)}</div>
    ${template.subject_line ? `<div style="font-size:12px; color:#6b7280; margin-bottom:16px;">Subject: ${escapeHtml(template.subject_line)}</div>` : '<div style="margin-bottom:16px;"></div>'}

    <div id="blocks-section">
      ${blocks.map(block => {
        const opts = (block.block_options || []).sort((a, b) => a.position - b.position);
        return `
          <div style="margin-bottom:16px;">
            <div style="font-weight:500; font-size:13px; margin-bottom:6px;">
              ${escapeHtml(block.name)}
              ${block.is_required ? '<span style="color:#dc2626;">*</span>' : ''}
            </div>
            <div>
              ${opts.map(opt => `
                <label style="display:flex; align-items:flex-start; gap:8px; padding:8px; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:4px; cursor:pointer;" data-block="${block.id}" data-opt="${opt.id}">
                  <input type="radio" name="block_${block.id}" value="${opt.id}" ${selectedOptionsByBlock[block.id] === opt.id ? 'checked' : ''} style="margin-top:2px;">
                  <div>
                    <div style="font-size:13px; font-weight:500;">${escapeHtml(opt.label || `Option ${opts.indexOf(opt) + 1}`)}</div>
                    ${(opt.option_attachments || []).length > 0 ? `
                      <div style="font-size:11px; color:#059669; margin-top:2px;">
                        📎 ${(opt.option_attachments || []).map(a => escapeHtml(a.file_name)).join(', ')}
                      </div>
                    ` : ''}
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${manualVars.length > 0 ? `
      <div style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:8px;">
        <div style="font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:10px;">Variables</div>
        ${manualVars.map(v => `
          <div style="margin-bottom:10px;">
            <label style="font-size:12px; color:#374151; display:block; margin-bottom:4px;">{${v.variable_name}}</label>
            <input
              type="text"
              class="maildraft-var-input"
              data-var="${v.variable_name}"
              placeholder="${v.default_value || v.variable_name}"
              style="width:100%; padding:6px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;"
            />
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:8px;">
      <div style="font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:10px;">Preview</div>
      <div id="maildraft-preview" style="font-size:12px; color:#374151; background:#f8fafc; border:1px solid #e5e7eb; border-radius:6px; padding:12px; white-space:pre-wrap; max-height:200px; overflow-y:auto;"></div>
    </div>
  `;

  document.getElementById('maildraft-back').addEventListener('click', () => {
    builderEl.style.display = 'none';
    footerEl.style.display = 'none';
    renderTemplateList();
  });

  // Bind radio buttons
  builderEl.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const blockId = e.target.name.replace('block_', '');
      selectedOptionsByBlock[blockId] = e.target.value;
      updatePreview();
    });
  });

  // Bind variable inputs
  builderEl.querySelectorAll('.maildraft-var-input').forEach(input => {
    input.addEventListener('input', (e) => {
      manualVariableValues[e.target.dataset.var] = e.target.value;
      updatePreview();
    });
  });

  updatePreview();
}

function updatePreview() {
  if (!currentTemplate) return;
  const preview = buildEmailContent();
  const previewEl = document.getElementById('maildraft-preview');
  if (previewEl) previewEl.textContent = preview.body + (preview.attachments.length > 0 ? '\n\n---\n📎 ' + preview.attachments.map(a => a.name).join(', ') : '');
}

function buildEmailContent() {
  if (!currentTemplate) return { body: '', attachments: [], subject: '' };

  const blocks = (currentTemplate.template_blocks || []).sort((a, b) => a.position - b.position);
  const variables = currentTemplate.template_variables || [];

  const parts = [];
  const attachments = [];

  blocks.forEach(block => {
    const opts = (block.block_options || []).sort((a, b) => a.position - b.position);
    const selectedId = selectedOptionsByBlock[block.id] || (opts[0] && opts[0].id);
    const option = opts.find(o => o.id === selectedId);

    if (option) {
      parts.push(fillVariables(option.body_text, variables));
      (option.option_attachments || []).forEach(att => {
        attachments.push({ name: att.file_name, url: att.google_drive_url });
      });
    }
  });

  const subject = fillVariables(currentTemplate.subject_line || '', variables);

  return { body: parts.join('\n\n'), attachments, subject };
}

function fillVariables(text, variables) {
  if (!text) return '';
  let filled = text;
  const today = new Date().toLocaleDateString('es-ES');

  (variables || []).forEach(v => {
    let value = '';
    switch (v.auto_fill_type) {
      case 'today_date':
        value = today;
        break;
      case 'recipient_name':
        value = getRecipientName() || `{${v.variable_name}}`;
        break;
      case 'sender_name':
        value = getSenderName() || `{${v.variable_name}}`;
        break;
      case 'manual':
      case 'custom':
        value = manualVariableValues[v.variable_name] || v.default_value || `{${v.variable_name}}`;
        break;
    }
    filled = filled.replace(new RegExp(`\\{${v.variable_name}\\}`, 'g'), value);
  });

  return filled;
}

function getRecipientName() {
  // Try to read recipient name from Gmail "To" field
  const toField = document.querySelector('span[email]');
  if (toField) {
    return toField.getAttribute('name') || toField.textContent.split('@')[0];
  }
  // Try email chip
  const chip = document.querySelector('.vR span');
  if (chip) return chip.textContent.split('@')[0];
  return null;
}

function getSenderName() {
  // Try to get from logged-in user info in Gmail
  const accountEl = document.querySelector('a[aria-label*="Google Account"]');
  if (accountEl) return accountEl.getAttribute('aria-label')?.split(' ')[0] || null;
  return null;
}

function insertEmail() {
  if (!currentTemplate) return;
  const { body, attachments, subject } = buildEmailContent();

  // Build HTML
  let html = body.replace(/\n/g, '<br>');

  if (attachments.length > 0) {
    html += '<br><br><hr style="border:none;border-top:1px solid #e5e7eb;">';
    html += '<strong>📎 Attached documents:</strong><br>';
    attachments.forEach(att => {
      html += `• <a href="${att.url}" target="_blank">${escapeHtml(att.name)}</a><br>`;
    });
  }

  insertEmailInGmail(html, subject);

  // Close sidebar
  document.getElementById('maildraft-sidebar').classList.remove('open');
}

function insertEmailInGmail(htmlContent, subjectLine) {
  const composeWin = window._maildraftComposeWin || document;

  // Insert subject
  if (subjectLine) {
    const subjectInput = (composeWin || document).querySelector('input[name="subjectbox"]')
      || document.querySelector('input[name="subjectbox"]');
    if (subjectInput) {
      subjectInput.value = subjectLine;
      subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Insert body
  const composeBody = document.querySelector('div[role="textbox"][aria-label*="Body"]')
    || document.querySelector('div[role="textbox"][aria-label*="body"]')
    || document.querySelector('div.Am.Al.editable')
    || document.querySelector('div[contenteditable="true"][role="textbox"]');

  if (composeBody) {
    composeBody.focus();
    document.execCommand('selectAll');
    document.execCommand('insertHTML', false, htmlContent);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text || ''));
  return div.innerHTML;
}

// Listen for auth token updates from the web app
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MAILDRAFT_TOKEN') {
    authToken = event.data.token;
    chrome.runtime.sendMessage({
      type: 'SET_AUTH_TOKEN',
      token: event.data.token,
      user: event.data.user,
    });
  }
});
