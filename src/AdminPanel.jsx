import { useState, useEffect } from 'react';
import './AdminPanel.css';

// ─── Secret password (second layer after URL secret) ───
const ADMIN_PASSWORD = 'mw@Lab2026';

const EMPTY_QUEST = {
  id: '',
  title: '',
  system: '',
  subtitle: '',
  thumbnail: '',
  challenge: '',
  solution: '',
  stack: [],
  images: [],
  metrics: [],
};

export default function AdminPanel() {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword]           = useState('');
  const [pwError, setPwError]             = useState('');

  // Data state
  const [quests, setQuests]         = useState([]);
  const [loading, setLoading]       = useState(true);

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm]     = useState(null);
  const [isNew, setIsNew]           = useState(false);
  const [newStackTag, setNewStackTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // quest id to delete

  // Save state
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState({ type: null, text: '' });

  // Fetch quest data on mount
  useEffect(() => {
    fetch('/content/quests.json')
      .then(r => r.json())
      .then(data => {
        setQuests(data.quests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ─── AUTH ───────────────────────────────────────────────
  const handleAuth = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPwError('');
    } else {
      setPwError('ACCESS DENIED. Incorrect password.');
    }
  };

  // ─── QUEST SELECTION ────────────────────────────────────
  const selectQuest = (quest) => {
    setSelectedId(quest.id);
    setIsNew(false);
    setEditForm({
      ...quest,
      stack:   [...(quest.stack   || [])],
      images:  [...(quest.images  || [])],
      metrics: (quest.metrics || []).map(m => ({ ...m })),
    });
    setSaveMsg({ type: null, text: '' });
    setNewStackTag('');
    setNewImageUrl('');
  };

  const startNewQuest = () => {
    const id = `quest-${Date.now()}`;
    setSelectedId(id);
    setIsNew(true);
    setEditForm({ ...EMPTY_QUEST, id });
    setSaveMsg({ type: null, text: '' });
    setNewStackTag('');
    setNewImageUrl('');
  };

  const cancelEdit = () => {
    setSelectedId(null);
    setEditForm(null);
    setIsNew(false);
    setSaveMsg({ type: null, text: '' });
  };

  // ─── DELETE ─────────────────────────────────────────────
  const confirmDeleteQuest = (id) => setConfirmDelete(id);

  const executeDelete = (id) => {
    const updated = quests.filter(q => q.id !== id);
    setQuests(updated);
    if (selectedId === id) cancelEdit();
    setConfirmDelete(null);
  };

  // ─── SAVE ALL ───────────────────────────────────────────
  const saveAll = async () => {
    if (!editForm) return;

    // Apply form changes to the quest list
    const cleanForm = {
      ...editForm,
      id: editForm.id.trim() || `quest-${Date.now()}`,
    };

    let updatedQuests;
    if (isNew) {
      updatedQuests = [...quests, cleanForm];
    } else {
      updatedQuests = quests.map(q => q.id === cleanForm.id ? cleanForm : q);
    }

    setSaving(true);
    setSaveMsg({ type: null, text: '' });

    try {
      const res  = await fetch('/api/save-quests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quests: updatedQuests }),
      });
      const data = await res.json();

      if (res.ok) {
        setQuests(updatedQuests);
        setIsNew(false);
        setSaveMsg({ type: 'success', text: '✅ Saved! Vercel is redeploying... (~30 seconds)' });
      } else {
        setSaveMsg({ type: 'error', text: `❌ Error: ${data.error}` });
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: `❌ Network error: ${err.message}` });
    }

    setSaving(false);
  };

  // ─── STACK TAG HELPERS ──────────────────────────────────
  const addStackTag = () => {
    const tag = newStackTag.trim();
    if (!tag || !editForm) return;
    setEditForm(f => ({ ...f, stack: [...f.stack, tag] }));
    setNewStackTag('');
  };

  const removeStackTag = (i) => {
    setEditForm(f => ({ ...f, stack: f.stack.filter((_, idx) => idx !== i) }));
  };

  // ─── IMAGE URL HELPERS ──────────────────────────────────
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url || !editForm) return;
    setEditForm(f => ({ ...f, images: [...f.images, url] }));
    setNewImageUrl('');
  };

  const removeImage = (i) => {
    setEditForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  };

  // ─── METRIC HELPERS ─────────────────────────────────────
  const addMetric = () => {
    setEditForm(f => ({ ...f, metrics: [...f.metrics, { label: '', value: '', desc: '' }] }));
  };

  const removeMetric = (i) => {
    setEditForm(f => ({ ...f, metrics: f.metrics.filter((_, idx) => idx !== i) }));
  };

  const updateMetric = (i, field, val) => {
    setEditForm(f => {
      const metrics = f.metrics.map((m, idx) => idx === i ? { ...m, [field]: val } : m);
      return { ...f, metrics };
    });
  };

  // ─── AUTH SCREEN ────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="adm-root">
        <div className="adm-auth-screen">
          <div className="adm-auth-card">
            <span className="adm-auth-icon">🔐</span>
            <div className="adm-auth-title">ADMIN PANEL</div>
            <div className="adm-auth-sub">USABILITY LAB // MAINFRAME ACCESS</div>
            <form onSubmit={handleAuth}>
              <input
                className="adm-auth-input"
                type="password"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(''); }}
                autoFocus
              />
              <button className="adm-auth-btn" type="submit">AUTHENTICATE →</button>
            </form>
            {pwError && <div className="adm-auth-error">{pwError}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN ADMIN UI ──────────────────────────────────────
  return (
    <div className="adm-root">
      {/* TOPBAR */}
      <div className="adm-topbar">
        <div className="adm-topbar-title">
          <span>⚡ ADMIN</span> // USABILITY LAB MAINFRAME
        </div>
        <div className="adm-topbar-right">
          <span className="adm-topbar-status">
            {quests.length} QUEST{quests.length !== 1 ? 'S' : ''} IN DATABASE
          </span>
          <button
            className="adm-logout-btn"
            onClick={() => { setAuthenticated(false); setPassword(''); }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="adm-body">
        {/* SIDEBAR */}
        <div className="adm-sidebar">
          <div className="adm-sidebar-header">
            <span className="adm-sidebar-label">Quest Database</span>
            <button className="adm-new-btn" onClick={startNewQuest}>+ NEW</button>
          </div>
          <div className="adm-quest-list">
            {loading && (
              <div style={{ padding: '20px', color: '#6e7681', fontSize: '11px', textAlign: 'center' }}>
                LOADING...
              </div>
            )}
            {!loading && quests.length === 0 && (
              <div style={{ padding: '20px', color: '#6e7681', fontSize: '11px', textAlign: 'center' }}>
                NO QUESTS YET
              </div>
            )}
            {quests.map(q => (
              <div
                key={q.id}
                className={`adm-quest-item ${selectedId === q.id ? 'active' : ''}`}
                onClick={() => selectQuest(q)}
              >
                <div className="adm-quest-item-info">
                  <div className="adm-quest-item-title">{q.title || '(untitled)'}</div>
                  <div className="adm-quest-item-id">{q.id}</div>
                </div>
                <button
                  className="adm-del-btn"
                  title="Delete"
                  onClick={e => { e.stopPropagation(); confirmDeleteQuest(q.id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="adm-main">
          {!editForm ? (
            <div className="adm-placeholder">
              <div className="adm-placeholder-icon">📋</div>
              <div className="adm-placeholder-text">SELECT A QUEST TO EDIT OR CREATE A NEW ONE</div>
            </div>
          ) : (
            <div className="adm-form">
              <div className="adm-form-title">
                {isNew ? '+ NEW QUEST' : `EDITING: ${editForm.title || editForm.id}`}
                <span>{editForm.id}</span>
              </div>

              {/* BASIC FIELDS */}
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label className="adm-label">Quest ID</label>
                  <input
                    className="adm-input"
                    value={editForm.id}
                    onChange={e => setEditForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="e.g. idecision"
                    disabled={!isNew}
                  />
                  <span className="adm-hint">Auto-generated. Lowercase, no spaces.</span>
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Title</label>
                  <input
                    className="adm-input"
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. iDecision Platform"
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">System Name</label>
                  <input
                    className="adm-input"
                    value={editForm.system}
                    onChange={e => setEditForm(f => ({ ...f, system: e.target.value }))}
                    placeholder="e.g. FINTECH_LMS.EXE"
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Subtitle</label>
                  <input
                    className="adm-input"
                    value={editForm.subtitle}
                    onChange={e => setEditForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="e.g. STAGE 01 // DEPLOYED FINTECH"
                  />
                </div>
              </div>

              {/* THUMBNAIL */}
              <div className="adm-form-group">
                <label className="adm-label">Thumbnail Image URL</label>
                <input
                  className="adm-input"
                  value={editForm.thumbnail}
                  onChange={e => setEditForm(f => ({ ...f, thumbnail: e.target.value }))}
                  placeholder="https://... (leave empty to use placeholder)"
                />
                <span className="adm-hint">Paste URL from Cloudinary, Imgur, or any CDN. Shown on the Works card.</span>
              </div>

              {/* CHALLENGE */}
              <div className="adm-form-group">
                <label className="adm-label">The Challenge</label>
                <textarea
                  className="adm-textarea"
                  value={editForm.challenge}
                  onChange={e => setEditForm(f => ({ ...f, challenge: e.target.value }))}
                  rows={4}
                  placeholder="Describe the problem or challenge faced..."
                />
                <span className="adm-hint">Supports Markdown: **bold**, _italic_, ![alt](image-url)</span>
              </div>

              {/* SOLUTION */}
              <div className="adm-form-group">
                <label className="adm-label">The Solution</label>
                <textarea
                  className="adm-textarea"
                  value={editForm.solution}
                  onChange={e => setEditForm(f => ({ ...f, solution: e.target.value }))}
                  rows={4}
                  placeholder="Describe your approach and solution..."
                />
                <span className="adm-hint">Supports Markdown: **bold**, _italic_, ![alt](image-url)</span>
              </div>

              {/* TECH STACK TAGS */}
              <div className="adm-form-group">
                <label className="adm-label">Tech Stack</label>
                <div className="adm-tags-container">
                  {editForm.stack.map((tag, i) => (
                    <div className="adm-tag" key={i}>
                      {tag}
                      <button className="adm-tag-remove" onClick={() => removeStackTag(i)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="adm-inline-row">
                  <input
                    className="adm-input"
                    style={{ flex: 1 }}
                    value={newStackTag}
                    onChange={e => setNewStackTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStackTag(); } }}
                    placeholder="e.g. Figma, React, TypeScript"
                  />
                  <button className="adm-inline-btn" onClick={addStackTag}>+ Add</button>
                </div>
              </div>

              {/* GALLERY IMAGES */}
              <div className="adm-form-group">
                <label className="adm-label">Gallery Images (URLs)</label>
                <div className="adm-image-list">
                  {editForm.images.map((url, i) => (
                    <div className="adm-image-row" key={i}>
                      <div className="adm-image-url">{url}</div>
                      <button className="adm-del-btn" onClick={() => removeImage(i)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="adm-inline-row">
                  <input
                    className="adm-input"
                    style={{ flex: 1 }}
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                    placeholder="https://... (paste image URL)"
                  />
                  <button className="adm-inline-btn" onClick={addImage}>+ Add</button>
                </div>
              </div>

              {/* METRICS */}
              <div className="adm-section-title">KEY METRICS</div>
              {editForm.metrics.map((m, i) => (
                <div className="adm-metric-row" key={i}>
                  <input
                    className="adm-input"
                    placeholder="Label (e.g. Approval Speed)"
                    value={m.label}
                    onChange={e => updateMetric(i, 'label', e.target.value)}
                  />
                  <input
                    className="adm-input"
                    placeholder="+45%"
                    value={m.value}
                    onChange={e => updateMetric(i, 'value', e.target.value)}
                  />
                  <input
                    className="adm-input"
                    placeholder="Short description..."
                    value={m.desc}
                    onChange={e => updateMetric(i, 'desc', e.target.value)}
                  />
                  <button className="adm-del-btn" onClick={() => removeMetric(i)}>✕</button>
                </div>
              ))}
              <button className="adm-add-row-btn" onClick={addMetric}>
                + Add Metric
              </button>

              {/* BOTTOM PADDING */}
              <div style={{ height: 80 }} />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SAVE BAR */}
      {editForm && (
        <div className="adm-footer">
          <div className={`adm-save-status ${saveMsg.type || ''}`}>
            {saveMsg.text}
          </div>
          <div className="adm-footer-actions">
            <button className="adm-cancel-btn" onClick={cancelEdit}>CANCEL</button>
            <button
              className="adm-save-btn"
              onClick={saveAll}
              disabled={saving}
            >
              {saving ? '⟳ SAVING...' : '💾 SAVE TO GITHUB'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="adm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="adm-confirm-card" onClick={e => e.stopPropagation()}>
            <div className="adm-confirm-title">⚠️ DELETE QUEST?</div>
            <div className="adm-confirm-body">
              Quest <strong style={{ color: '#c9d1d9' }}>
                {quests.find(q => q.id === confirmDelete)?.title || confirmDelete}
              </strong> will be permanently deleted from the portfolio.
              <br /><br />
              You will still need to click <strong style={{ color: '#58a6ff' }}>SAVE TO GITHUB</strong> to apply the change.
            </div>
            <div className="adm-confirm-actions">
              <button className="adm-cancel-btn" onClick={() => setConfirmDelete(null)}>CANCEL</button>
              <button className="adm-confirm-del" onClick={() => executeDelete(confirmDelete)}>
                YES, DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
