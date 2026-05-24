import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, Compass, Zap, Layers, Award } from 'lucide-react';
import './AdminPanel.css';

// ─── Secret password (second layer after URL secret) ───
const ADMIN_PASSWORD = 'mw@Lab2026';

const EMPTY_QUEST = {
  id: '',
  title: '',
  system: '',
  subtitle: '',
  thumbnail: '',
  content: '',
  challenge: '',
  solution: '',
  isLocked: false,
  password: '',
  stack: [],
  images: [],
  metrics: [],
};

const DEFAULT_MARKDOWN_TEMPLATE = `## 🧭 The Challenge
Describe the problem, the context, and what needed to be accomplished...

## ⚡ The Solution
Explain your UI/UX and product design solution here. Use bullet points or headers to organize.

### Key Features
- **Feature 1**: Description
- **Feature 2**: Description

### Design System & Assets
Details about the visual design or component foundations.

## 🛠️ Tools & Technologies Used
Figma, FigJam, Miro, Photoshop, Adobe Illustrator

## 🖼️ Design Gallery
![Design Flow](https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80)
![High Fidelity UI](https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80)
`;

export default function AdminPanel() {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword]           = useState('');
  const [pwError, setPwError]             = useState('');

  // Forgot password state
  const [resetView, setResetView]   = useState(null); // null | 'sending' | 'verify'
  const [resetToken, setResetToken] = useState('');
  const [resetOtp, setResetOtp]     = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [maskedEmail, setMaskedEmail]   = useState('');

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
    // Fetch initial data
    fetch('/content/quests.json?v=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
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

  // ─── FORGOT PASSWORD ────────────────────────────────────
  const handleForgotPassword = async () => {
    setResetView('sending');
    setResetError('');
    setResetLoading(true);
    try {
      const res  = await fetch('/api/forgot-password', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.token);
        setMaskedEmail(data.maskedEmail || 'mo***@gmail.com');
        setResetView('verify');
        // In local dev without RESEND_API_KEY, show OTP directly
        if (data.devOtp) setResetOtp(data.devOtp);
      } else {
        setResetError(data.error || 'Failed to send OTP.');
        setResetView(null);
      }
    } catch {
      setResetError('Network error. Please try again.');
      setResetView(null);
    }
    setResetLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const res  = await fetch('/api/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ otp: resetOtp, token: resetToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        setResetView(null);
        setResetOtp('');
        setResetToken('');
      } else {
        setResetError(data.error || 'Verification failed.');
      }
    } catch {
      setResetError('Network error. Please try again.');
    }
    setResetLoading(false);
  };

  // ─── QUEST SELECTION ────────────────────────────────────
  const selectQuest = (quest) => {
    setSelectedId(quest.id);
    setIsNew(false);

    // Auto-migrate challenge & solution into content if content is missing
    let content = quest.content || '';
    if (!content && (quest.challenge || quest.solution)) {
      content = `## 🧭 The Challenge\n${quest.challenge || ''}\n\n## ⚡ The Solution\n${quest.solution || ''}`;
    }

    setEditForm({
      ...quest,
      content,
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
    setEditForm({ ...EMPTY_QUEST, id, content: DEFAULT_MARKDOWN_TEMPLATE });
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
        setSaveMsg({ type: 'success', text: data.message.includes('Vercel') ? '✅ Saved! Vercel is redeploying... (~30s)' : '✅ Saved locally!' });

        if (data.message.includes('Vercel')) {
          let attempts = 0;
          const maxAttempts = 24; // 24 * 5s = 120 seconds
          const pollDeploy = async () => {
            if (attempts >= maxAttempts) {
              setSaveMsg({ type: 'warning', text: '⚠️ Deploy is taking longer than expected. Please check mosesdsgn.vercel.app manually.' });
              return;
            }
            attempts++;
            try {
              const prodRes = await fetch('https://mosesdsgn.vercel.app/content/quests.json?v=' + Date.now(), { cache: 'no-store' });
              if (prodRes.ok) {
                const prodData = await prodRes.json();
                if (JSON.stringify(prodData.quests) === JSON.stringify(updatedQuests)) {
                  setSaveMsg({ type: 'success', text: '🚀 VERCEL DEPLOYMENT LIVE! You can now view it at mosesdsgn.vercel.app' });
                  return;
                }
              }
            } catch (e) {
              // ignore network errors during polling
            }
            setTimeout(pollDeploy, 5000);
          };
          setTimeout(pollDeploy, 10000); // Start polling after 10 seconds
        }
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

  const [uploading, setUploading] = useState(false);
  const thumbnailInputRef = useRef(null);
  const markdownImageInputRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Only images are supported!');
      return null;
    }

    setUploading(true);
    setSaveMsg({ type: null, text: '⟳ Uploading image to mainframe...' });

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileData: base64Data,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMsg({ type: 'success', text: `✅ Uploaded ${file.name} successfully!` });
        return data.url;
      } else {
        setSaveMsg({ type: 'error', text: `❌ Upload error: ${data.error}` });
        return null;
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: `❌ Network upload error: ${err.message}` });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const insertMarkdown = (syntax, placeholder = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || placeholder;

    const replacement = syntax.replace('$', selected);
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setEditForm(f => ({ ...f, content: newContent }));

    // Reset cursor selection after state updates
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.indexOf(selected), start + replacement.indexOf(selected) + selected.length);
    }, 50);
  };

  const insertImageAtCursor = (url) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const imageMarkdown = `\n![Image](${url})\n`;
    const newContent = text.substring(0, start) + imageMarkdown + text.substring(end);
    
    setEditForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
    }, 50);
  };

  const handleThumbnailFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const url = await uploadFile(files[0]);
      if (url) {
        setEditForm(f => ({ ...f, thumbnail: url }));
      }
    }
    if (e.target) e.target.value = null;
  };

  const handleMarkdownImageFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const url = await uploadFile(files[0]);
      if (url) {
        insertImageAtCursor(url);
      }
    }
    if (e.target) e.target.value = null;
  };

  if (!authenticated) {
    // ── OTP Verify Screen
    if (resetView === 'verify') {
      return (
        <div className="adm-root">
          <div className="adm-auth-screen">
            <div className="adm-auth-card">
              <span className="adm-auth-icon">📬</span>
              <div className="adm-auth-title">CHECK YOUR EMAIL</div>
              <div className="adm-auth-sub" style={{ marginBottom: 6 }}>OTP sent to</div>
              <div style={{ color: '#58a6ff', fontSize: 13, letterSpacing: 1, marginBottom: 20 }}>{maskedEmail}</div>
              <form onSubmit={handleVerifyOtp}>
                <input
                  className="adm-auth-input"
                  type="text"
                  placeholder="ENTER OTP (e.g. A3F2C1B4)"
                  value={resetOtp}
                  onChange={e => { setResetOtp(e.target.value.toUpperCase()); setResetError(''); }}
                  maxLength={8}
                  autoFocus
                />
                <button className="adm-auth-btn" type="submit" disabled={resetLoading}>
                  {resetLoading ? '⟳ VERIFYING...' : 'VERIFY OTP →'}
                </button>
              </form>
              {resetError && <div className="adm-auth-error">{resetError}</div>}
              <button
                className="adm-forgot-link"
                style={{ marginTop: 16 }}
                onClick={() => { setResetView(null); setResetOtp(''); setResetError(''); }}
              >
                ← Back to Login
              </button>
              <div style={{ marginTop: 12, color: '#6e7681', fontSize: 10, letterSpacing: 1 }}>
                OTP expires in 15 minutes
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Sending OTP Screen
    if (resetView === 'sending') {
      return (
        <div className="adm-root">
          <div className="adm-auth-screen">
            <div className="adm-auth-card">
              <span className="adm-auth-icon" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              <div className="adm-auth-title">SENDING OTP...</div>
              <div className="adm-auth-sub">Dispatching temporary password to email</div>
            </div>
          </div>
        </div>
      );
    }

    // ── Default Login Screen
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
            <button
              className="adm-forgot-link"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              Forgot password? Send OTP to email →
            </button>
            {resetError && <div className="adm-auth-error">{resetError}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN ADMIN UI ──────────────────────────────────────
  return (
    <div className="adm-root adm-body-split">
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

        {/* MAIN CONTENT (SPLIT SCREEN) */}
        <div className="adm-main-split">
          {!editForm ? (
            <div className="adm-placeholder">
              <div className="adm-placeholder-icon">📋</div>
              <div className="adm-placeholder-text">SELECT A QUEST TO EDIT OR CREATE A NEW ONE</div>
            </div>
          ) : (
            <div className="adm-editor-split">
              
              {/* LEFT COLUMN: FORM & EDITOR */}
              <div className="adm-editor-pane">
                
                {/* CARD 1: BASIC METADATA */}
                <div className="adm-card">
                  <div className="adm-card-title">BASIC METADATA</div>
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
                    <div className="adm-form-group" style={{ gridColumn: '1 / -1', borderTop: '1px dashed #30363d', paddingTop: '15px', marginTop: '5px' }}>
                      <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={editForm.isLocked || false}
                          onChange={e => setEditForm(f => ({ ...f, isLocked: e.target.checked }))}
                          style={{ accentColor: '#ff7b72', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        🔒 Lock this Portfolio (Require Password)
                      </label>
                      {editForm.isLocked && (
                        <div style={{ marginTop: '12px' }}>
                          <input
                            className="adm-input"
                            value={editForm.password || ''}
                            onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="Set Access Password (e.g. moses-lab-2026)"
                            style={{ borderColor: '#ff7b72', background: 'rgba(255, 123, 114, 0.05)' }}
                          />
                          <span className="adm-hint" style={{ color: '#ff7b72' }}>Password will be required to view the content.</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className="adm-form-group" 
                    style={{ marginBottom: 0 }}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.opacity = 0.8; }}
                    onDragLeave={e => { e.currentTarget.style.opacity = 1; }}
                    onDrop={async e => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.opacity = 1;
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        const url = await uploadFile(files[0]);
                        if (url) {
                          setEditForm(f => ({ ...f, thumbnail: url }));
                        }
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                      <label className="adm-label" style={{ marginBottom: 0 }}>Thumbnail Image URL</label>
                      <button 
                        className="adm-new-btn" 
                        style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: '#21262d', border: '1px solid #30363d' }} 
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={uploading}
                        title="Browse local files"
                      >
                        📁 BROWSE
                      </button>
                      <input 
                        type="file" 
                        ref={thumbnailInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleThumbnailFileChange} 
                      />
                    </div>
                    <input
                      className="adm-input"
                      value={editForm.thumbnail}
                      onChange={e => setEditForm(f => ({ ...f, thumbnail: e.target.value }))}
                      placeholder="https://... (paste or drag-and-drop file here)"
                      style={{ border: uploading ? '1px dashed #ffd700' : '' }}
                      disabled={uploading}
                    />
                    <span className="adm-hint">
                      {uploading ? '⟳ UPLOADING TO MAINFRAME...' : '💡 Tip: Drag and drop an image file here to upload directly!'}
                    </span>
                  </div>
                </div>

                {/* CARD 2: KEY METRICS */}
                <div className="adm-card">
                  <div className="adm-card-title">
                    KEY METRICS
                    <button className="adm-new-btn" style={{ padding: '3px 8px' }} onClick={addMetric}>+ ADD</button>
                  </div>
                  {editForm.metrics.length === 0 && (
                    <div style={{ color: '#6e7681', fontSize: 11, textAlign: 'center', padding: '10px 0' }}>
                      NO METRICS YET (OPTIONAL)
                    </div>
                  )}
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
                </div>

                {/* CARD 3: RICH MARKDOWN CASE STUDY EDITOR */}
                <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="adm-card-title">PORTFOLIO CASE STUDY CONTENT</div>
                  <div className="adm-editor-container">
                    <div className="adm-editor-toolbar">
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('**$**', 'bold text')}>Bold</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('_$_', 'italic text')}>Italic</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('# $', 'Heading 1')}>H1</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('## $', 'Heading 2')}>H2</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('### $', 'Heading 3')}>H3</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('- $', 'list item')}>List</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('[$](url)', 'link text')}>Link</button>
                      <button className="adm-editor-tool-btn" onClick={() => insertMarkdown('![$](image-url)', 'image alt')}>Image</button>
                      <button 
                        className="adm-editor-tool-btn" 
                        style={{ backgroundColor: '#1f6feb', color: '#fff', border: 'none', marginLeft: '5px' }} 
                        onClick={() => markdownImageInputRef.current?.click()}
                        disabled={uploading}
                      >
                        📁 Upload Image
                      </button>
                      <input 
                        type="file" 
                        ref={markdownImageInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleMarkdownImageFileChange} 
                      />
                      <button className="adm-editor-tool-btn" onClick={() => setEditForm(f => ({ ...f, content: f.content + '\n' + DEFAULT_MARKDOWN_TEMPLATE }))} style={{ marginLeft: 'auto' }}>Load Template</button>
                    </div>
                    <textarea
                      id="markdown-editor"
                      className="adm-editor-textarea"
                      value={editForm.content}
                      onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write your UI/UX design case study here in Markdown format..."
                      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#58a6ff'; }}
                      onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
                      onDrop={async e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.style.borderColor = '';
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          const url = await uploadFile(files[0]);
                          if (url) {
                            // Insert Markdown syntax at current cursor selection
                            const start = e.currentTarget.selectionStart || 0;
                            const end = e.currentTarget.selectionEnd || 0;
                            const text = e.currentTarget.value;
                            const caption = files[0].name.split('.')[0] || 'Design Showcase';
                            const syntax = `\n![${caption}](${url})\n`;
                            const newContent = text.substring(0, start) + syntax + text.substring(end);
                            setEditForm(f => ({ ...f, content: newContent }));
                          }
                        }
                      }}
                      disabled={uploading}
                    />
                  </div>
                  <span className="adm-hint">Supports Markdown natively. Use the buttons above to quickly insert elements.</span>
                </div>

                <div style={{ height: 40 }} />
              </div>

              {/* RIGHT COLUMN: LIVE PREMIUM PREVIEW */}
              <div className="adm-preview-pane">
                <div className="adm-preview-header">
                  <div className="adm-preview-title">⚡ REALTIME PORTFOLIO PREVIEW</div>
                  <div className="adm-preview-badge">MAINFRAME SIMULATOR</div>
                </div>
                <div className="adm-preview-frame">
                  {/* Embedded high-fidelity quest-showcase-screen */}
                  <div className="quest-showcase-screen theme-sage">
                    <div className="quest-scanline"></div>
                    
                    {/* Floating Top Navigation */}
                    <nav className="quest-top-nav" style={{ position: 'sticky', top: 0 }}>
                      <button className="quest-back-btn-modern" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                        ← Back to Works
                      </button>
                      <div className="quest-nav-status">
                        <span className="quest-pulse-dot"></span> SECURE CONNECTION (PREVIEW)
                      </div>
                    </nav>

                    {/* Main Content Area */}
                    <div className="quest-main-container" style={{ padding: '35px 20px 80px 20px' }}>
                      
                      <header className="quest-hero-header" style={{ marginBottom: 30 }}>
                        <div className="quest-role-badge">Product Designer // UI/UX</div>
                        <h1 className="quest-modern-title" style={{ fontSize: 36 }}>{editForm.title || '(untitled quest)'}</h1>
                        <div className="quest-header-meta">
                          {editForm.system || 'SYSTEM_NAME.EXE'} — {editForm.subtitle || 'STAGE 01 // SUBTITLE'}
                        </div>
                      </header>

                      {/* Cover Visual */}
                      {editForm.thumbnail ? (
                        <div className="quest-cover-img" style={{ height: 280, marginBottom: 30 }}>
                          <img src={editForm.thumbnail} alt={`${editForm.title} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div className="quest-cover-visual" style={{ height: 280, marginBottom: 30 }}>
                          <div className="quest-cover-overlay">
                            <Terminal size={24} />
                            <span style={{ marginTop: '10px', fontSize: 11 }}>NO THUMBNAIL SET (USING RETRO PLACEHOLDER)</span>
                          </div>
                        </div>
                      )}

                      {/* Metrics Grid */}
                      {editForm.metrics && editForm.metrics.length > 0 && (
                        <div className="quest-metrics-grid" style={{ marginBottom: 30, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15 }}>
                          {editForm.metrics.map((metric, idx) => (
                            <div key={idx} className="metric-card-modern" style={{ padding: 16 }}>
                              <div className="metric-value-modern" style={{ fontSize: 28 }}>{metric.value || '+0%'}</div>
                              <div className="metric-label-modern" style={{ fontSize: 12 }}>{metric.label || 'Metric Label'}</div>
                              <p className="metric-desc-modern" style={{ fontSize: 11 }}>{metric.desc || 'Short description of the result...'}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Unified Markdown Body */}
                      <section className="quest-article-section">
                        <div className="quest-article-text quest-markdown">
                          {editForm.content ? (
                            <ReactMarkdown
                              components={{
                                img: ({src, alt}) => (
                                  <span className="quest-inline-img" style={{ display: 'block' }}>
                                    <img src={src} alt={alt} style={{ display: 'block', width: '100%' }} />
                                    {alt && <span className="quest-img-caption" style={{ display: 'block' }}>{alt}</span>}
                                  </span>
                                ),
                                h1: ({children}) => <h1 className="quest-section-title-modern" style={{ fontSize: 18 }}>{children}</h1>,
                                h2: ({children}) => <h2 className="quest-section-title-modern" style={{ fontSize: 18 }}>{children}</h2>,
                                h3: ({children}) => <h3 className="quest-section-title-modern" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '15px', fontSize: 15 }}>{children}</h3>,
                              }}
                            >{editForm.content}</ReactMarkdown>
                          ) : (
                            <div style={{ color: '#6e7681', textAlign: 'center', padding: '40px 0', border: '1px dashed #30363d', borderRadius: 8 }}>
                              Start typing case study markdown in the editor to preview case study live details here.
                            </div>
                          )}
                        </div>
                      </section>

                      <div className="quest-end-marker" style={{ marginTop: 40 }}>
                         // END OF REPORT PREVIEW //
                      </div>

                    </div>
                  </div>
                </div>
              </div>

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
