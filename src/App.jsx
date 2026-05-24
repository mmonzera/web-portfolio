import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, Award, Sparkles, Terminal, Activity, Zap, Layers, Compass, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import lookingRight from './assets/looking-right.png';
import lookingLeft from './assets/looking-left.png';
import bgImgUrl from './assets/bg.jpg';
import { playBootSound, playClickSound, playTabSound, playCloseSound, playRgbSwitchSound, playQuestStartSound, playStartGameSound } from './utils/sound';

function App() {
  const [loading, setLoading] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isLookingRight, setIsLookingRight] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [rgbTheme, setRgbTheme] = useState('sage');
  const [speechBubble, setSpeechBubble] = useState(null);
  const [showToolStack, setShowToolStack] = useState(false);
  const [launchingQuest, setLaunchingQuest] = useState(null);
  const [questProgress, setQuestProgress] = useState(0);
  const [activeQuest, setActiveQuest] = useState(null);
  const [questData, setQuestData] = useState(null);
  const containerRef = useRef(null);
  const bgLoadedRef = useRef(false);

  const quests = questData ? Object.values(questData) : [];

  useEffect(() => {
    // Fetch CMS data with no-store to ensure we always get the latest quests after deployment
    fetch('/content/quests.json?v=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.quests) {
          const map = {};
          data.quests.forEach(q => map[q.id] = q);
          setQuestData(map);
        }
      })
      .catch(err => console.error("Error loading quests.json:", err));

    const img = new window.Image();
    img.src = bgImgUrl;
    img.onload = () => { bgLoadedRef.current = true; };
  }, []);

  useEffect(() => {
    if (loading < 100) {
      const timer = setTimeout(() => {
        setLoading(prev => {
          if (prev >= 99 && !bgLoadedRef.current) return 99;
          return Math.min(prev + 1, 100);
        });
      }, 25);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowStartScreen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleStartGame = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    playStartGameSound();
    
    // Animate CRT shut-off/turn-on glitch transitions
    setTimeout(() => {
      setIsLoaded(true);
      setShowStartScreen(false);
      setIsGlitching(false);
      // Show workstation speech welcome bubble after a short delay
      setTimeout(() => {
        setSpeechBubble("Welcome to my Usability Lab! Click items to explore my workstation 👾");
        setTimeout(() => setSpeechBubble(null), 6000);
      }, 1000);
    }, 1400);
  };


  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsLookingRight(e.clientX >= window.innerWidth / 2);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!launchingQuest) return;
    if (questProgress < 100) {
      const timer = setTimeout(() => {
        setQuestProgress(prev => Math.min(prev + 2, 100));
      }, 25);
      return () => clearTimeout(timer);
    } else {
      playQuestStartSound();
      const timer = setTimeout(() => {
        setActiveQuest(launchingQuest.id);
        setLaunchingQuest(null);
        setQuestProgress(0);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [launchingQuest, questProgress]);

  const startQuest = (name, id) => {
    playClickSound(1200, 0.15, 'sawtooth');
    setIsModalOpen(false);
    setLaunchingQuest({ name, id });
    setQuestProgress(0);
  };

  const openModal = () => {
    setIsModalOpen(true);
    playBootSound();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    playCloseSound();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    playTabSound();
  };

  const toggleRgbTheme = () => {
    let nextTheme = 'sage';
    if (rgbTheme === 'sage') nextTheme = 'pink';
    else if (rgbTheme === 'pink') nextTheme = 'cyan';
    setRgbTheme(nextTheme);
    playRgbSwitchSound();
    setSpeechBubble(`RGB theme switched to ${nextTheme.toUpperCase()}! ⚡`);
    setTimeout(() => setSpeechBubble(null), 3000);
  };

  if (!isLoaded) {
    return (
      <div className={`loading-screen ${isGlitching ? 'crt-glitch-active' : ''}`}>
        <div className="scanlines"></div>
        {isGlitching && <div className="crt-flash-overlay"></div>}
        
        {!showStartScreen ? (
          <div className="loading-container">
            <div className="loading-border">
              <div className="loading-title">
                <span className="letter l">L</span>
                <span className="letter o">O</span>
                <span className="letter a">A</span>
                <span className="letter d">D</span>
                <span className="letter i">I</span>
                <span className="letter n">N</span>
                <span className="letter g">G</span>
              </div>
              <div className="bar-outer">
                <div className="bar-inner" style={{ width: `${loading}%` }}>
                  <div className="bar-shine"></div>
                </div>
              </div>
              <div className="loading-percent">
                <span className="percent-text">{loading}%</span>
              </div>
              <div className="loading-decoration">
                <span className="pixel-star">★</span>
                <span className="pixel-star">★</span>
                <span className="pixel-star">★</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`title-screen-container ${isGlitching ? 'glitch-shake' : ''}`}>
            <div className="title-arcade-border">
              <div className="arcade-header-telemetry">
                <span>SYSTEM BOOT: SUCCESSFUL</span>
                <span>ROM VERSION: 2026.05.22</span>
              </div>
              
              <div className="arcade-title-group">
                <div className="arcade-tagline">MOSES WISNU'S</div>
                <h1 className="arcade-main-title">
                  <span className="neon-text-red">USABILITY</span>
                  <span className="neon-text-blue">LAB</span>
                </h1>
                <div className="arcade-sub-tag">PRODUCT DESIGNER // PORTFOLIO</div>
              </div>
              
              <div className="arcade-center-panel">
                <div className="arcade-grid-animation"></div>
                
                <button 
                  className={`press-start-btn ${isGlitching ? 'pressed' : ''}`}
                  onClick={handleStartGame}
                  disabled={isGlitching}
                >
                  {isGlitching ? 'LAUNCHING QUEST...' : 'PRESS START TO PLAY'}
                </button>
              </div>
              
              <div className="arcade-footer-telemetry">
                <span className="telemetry-item blink-slow">INSERT COIN [01]</span>
                <span className="telemetry-item">FREE PLAY // CREDITS: 99</span>
              </div>
            </div>
            
            <div className="arcade-cabinet-grid-bottom"></div>
          </div>
        )}
      </div>
    );
  }

  const tools = [
    {
      name: 'Figma',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="none"><path d="M12 2H8.5a3.5 3.5 0 0 0 0 7h3.5V2z" fill="#F24E1E"/><path d="M12 9H8.5a3.5 3.5 0 0 0 0 7h3.5V9z" fill="#FF7262"/><path d="M12 16H8.5a3.5 3.5 0 0 0 0 7h3.5v-7z" fill="#A259FF"/><path d="M19.5 12a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="#1ABCFE"/><path d="M15.5 2h-3.5v7h3.5a3.5 3.5 0 0 0 0-7z" fill="#0ACF83"/></svg>`
    },
    {
      name: 'Adobe Illustrator',
      icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#FF9A00"/><path d="M7 17l4-10h2l4 10h-2.2l-1.2-3.2H10.4L9.2 17H7zm4.2-5h1.6l-.8-2.4h-.1L11.2 12z" fill="white"/></svg>`
    },
    {
      name: 'ChatGPT',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#10A37F"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#10A37F" opacity="0.6"/></svg>`
    },
    {
      name: 'Gemini',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#4285F4"/><path d="M12 10L13.5 11.5L12 14L10.5 11.5L12 10Z" fill="#A8E6CF"/></svg>`
    },
    {
      name: 'Miro',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 2L8 12L4 22H20L16 12L20 2H4Z" fill="#FFD02B"/><path d="M6 4L9 12L6 20H18L15 12L18 4H6Z" fill="#050038"/></svg>`
    },
    {
      name: 'Photoshop',
      icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#31A8FF"/><path d="M7 17V7h2.5a2.5 2.5 0 0 1 0 5H7m5 5v-4m0 0c1 0 2.5 0 2.5-2.5S13 8 12 8h-1v5h1z" stroke="white" stroke-width="1.2" fill="none"/></svg>`
    },
  ];



  const renderQuestShowcase = () => {
    if (!activeQuest || !questData || !questData[activeQuest]) return null;
    const current = questData[activeQuest];
    return (
      <>
        <div className="quest-scanline"></div>
        
        {/* Floating Top Navigation */}
        <nav className="quest-top-nav">
          <button className="quest-back-btn-modern" onClick={() => {
            playCloseSound();
            setActiveQuest(null);
          }}>
            ← Back to Works
          </button>
          <div className="quest-nav-status">
            <span className="quest-pulse-dot"></span> SECURE CONNECTION
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="quest-main-container">
          
          <header className="quest-hero-header">
            <div className="quest-role-badge">Lead Product Designer // UI/UX</div>
            <h1 className="quest-modern-title">{current.title}</h1>
            <div className="quest-header-meta">
              {current.system} — {current.subtitle}
            </div>
          </header>

          {/* Cover Visual — shows thumbnail if set, otherwise a placeholder */}
          {current.thumbnail ? (
            <div className="quest-cover-img">
              <img src={current.thumbnail} alt={`${current.title} cover`} />
            </div>
          ) : (
            <div className="quest-cover-visual">
              <div className="quest-cover-overlay">
                <Terminal size={32} />
                <span style={{ marginTop: '15px' }}>ACCESSING SECURE MAINFRAME...</span>
              </div>
            </div>
          )}

          <div className="quest-metrics-grid">
            {current.metrics && current.metrics.map((metric) => (
              <div key={metric.label} className="metric-card-modern">
                <div className="metric-value-modern">{metric.value}</div>
                <div className="metric-label-modern">{metric.label}</div>
                <p className="metric-desc-modern">{metric.desc}</p>
              </div>
            ))}
          </div>

          {current.content ? (
            <section className="quest-article-section">
              <div className="quest-article-text quest-markdown">
                <ReactMarkdown
                  components={{
                    img: ({src, alt}) => (
                      <span className="quest-inline-img" style={{ display: 'block' }}>
                        <img src={src} alt={alt} style={{ display: 'block', width: '100%' }} />
                        {alt && <span className="quest-img-caption" style={{ display: 'block' }}>{alt}</span>}
                      </span>
                    ),
                    h1: ({children}) => <h1 className="quest-section-title-modern">{children}</h1>,
                    h2: ({children}) => <h2 className="quest-section-title-modern">{children}</h2>,
                    h3: ({children}) => <h3 className="quest-section-title-modern" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '20px' }}>{children}</h3>,
                  }}
                >{current.content}</ReactMarkdown>
              </div>
            </section>
          ) : (
            <>
              <section className="quest-article-section">
                <h2 className="quest-section-title-modern">
                  <Compass size={20} /> The Challenge
                </h2>
                <div className="quest-article-text quest-markdown">
                  <ReactMarkdown
                    components={{
                      img: ({src, alt}) => (
                        <div className="quest-inline-img">
                          <img src={src} alt={alt} />
                          {alt && <span className="quest-img-caption">{alt}</span>}
                        </div>
                      )
                    }}
                  >{current.challenge}</ReactMarkdown>
                </div>
              </section>

              <section className="quest-article-section">
                <h2 className="quest-section-title-modern">
                  <Zap size={20} /> The Solution
                </h2>
                <div className="quest-article-text quest-markdown">
                  <ReactMarkdown
                    components={{
                      img: ({src, alt}) => (
                        <div className="quest-inline-img">
                          <img src={src} alt={alt} />
                          {alt && <span className="quest-img-caption">{alt}</span>}
                        </div>
                      )
                    }}
                  >{current.solution}</ReactMarkdown>
                </div>
              </section>

              <section className="quest-article-section">
                <h2 className="quest-section-title-modern">
                  <Layers size={20} /> Tech Stack & Tools
                </h2>
                <div className="quest-tech-tags">
                  {current.stack && current.stack.map(tech => (
                    <span key={tech} className="quest-tech-tag-modern">{tech}</span>
                  ))}
                </div>
              </section>

              {/* Gallery Images — shown when images are uploaded via CMS */}
              {current.images && current.images.length > 0 && (
                <section className="quest-article-section">
                  <h2 className="quest-section-title-modern">
                    <Layers size={20} /> Design Gallery
                  </h2>
                  <div className="quest-gallery-grid">
                    {current.images.map((img, idx) => (
                      <div key={idx} className="quest-gallery-item">
                        <img src={img} alt={`${current.title} screenshot ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <div className="quest-end-marker">
             // END OF REPORT //
          </div>

        </div>
      </>
    );
  };

  // --- Admin panel is now at /?admin=m0s3s-lab-2026 ---

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="tab-pane"
          >
            <div className="about-grid">
              <div className="about-left">
                <div className="about-avatar-container">
                  <div className="avatar-pixel-border">
                    <img src={lookingRight} alt="Avatar" className="avatar-image" />
                  </div>
                  <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span>ONLINE & DESIGNING</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <Terminal size={12} className="stat-icon-glow" />
                    <span>SKILLS</span>
                  </div>
                  <div className="stat-card-body skills-text">
                    <div className="skill-category">
                      <span className="skill-cat-label">Design:</span>
                      <span className="skill-items">UI Design | UX Research | Wireframing | Prototyping | Information Architecture | Design Systems</span>
                    </div>
                    <div className="skill-category">
                      <span className="skill-cat-label">Process:</span>
                      <span className="skill-items">User Testing | Heuristic Evaluation | Stakeholder Facilitation | Cross-functional Collaboration</span>
                    </div>
                    <div className="skill-category">
                      <span className="skill-cat-label">Management:</span>
                      <span className="skill-items">Project Management | Product Roadmapping | Requirements Gathering</span>
                    </div>
                    <div className="skill-category">
                      <span className="skill-cat-label">Tools:</span>
                      <span className="skill-items">Figma | FigJam | Miro | Adobe Illustrator | Adobe Photoshop</span>
                    </div>
                    <div className="skill-category">
                      <span className="skill-cat-label">Domain:</span>
                      <span className="skill-items">Digital Lending | AML | KYC | Fraud Detection | Loan Management Systems | Collection Workflows</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-right">
                <div className="chat-bubble-intro">
                  <Sparkles size={16} className="sparkle-icon" />
                  <h4>HELLO, ADVENTURER! 👾</h4>
                </div>
                <div className="about-text">
                  <p>
                    Senior-track Product Designer with 4+ years driving end-to-end design for iDecision, a Digital Lending Platform serving multiple banking institutions. Deep domain expertise in Financial Crime Management (AML, KYC, Fraud), loan origination, and field collection — spanning the full product lifecycle from user research to production handoff. Proven track record establishing design foundations from scratch, including a 30-40 component design system adopted by 3 engineering teams. Actively expanding scope toward Product Management, with strong experience in stakeholder alignment, requirements definition, and data-driven decision-making.
                  </p>
                  <blockquote className="quote-box">
                    "Building clean pixel-perfect logic, one keystroke at a time."
                  </blockquote>
                  <div className="social-links">
                    <a href="https://www.linkedin.com/in/moses-wisnu-1869b7165/" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <a href="https://github.com/mmonzera" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'works':
        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="tab-pane"
          >
            <div className="pane-header">
              <h3>MY PROJECTS & QUESTS</h3>
              <p className="pane-subtitle">Moses's design contributions and product milestones.</p>
            </div>
            <div className="projects-grid">
              {quests.map((quest, i) => (
                <div
                  key={quest.id}
                  className="project-card"
                  onMouseEnter={() => playClickSound(600 + i * 50, 0.04, 'triangle')}
                >
                  <div
                    className="project-preview"
                    style={quest.thumbnail
                      ? { backgroundImage: `url(${quest.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: `linear-gradient(135deg, hsl(${220 + i * 30}, 30%, 14%), hsl(${220 + i * 30}, 25%, 8%))` }
                    }
                  >
                    <div className="project-preview-overlay">
                      <span className="system-type">{quest.system}</span>
                    </div>
                  </div>
                  <div className="project-info">
                    <h4>{quest.title}</h4>
                    <p>{quest.subtitle}</p>
                    <div className="tags-container">
                      {quest.stack && quest.stack.slice(0, 3).map(t => (
                        <span key={t} className="tag">{t.toUpperCase()}</span>
                      ))}
                    </div>
                    <button className="launch-quest-btn" onClick={() => startQuest(quest.title, quest.id)}>
                      LAUNCH QUEST <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'experience':
        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="tab-pane"
          >
            <div className="pane-header">
              <h3>CAREER QUESTLINE</h3>
              <p className="pane-subtitle">Professional experience journey.</p>
            </div>
            <div className="experience-timeline">
              <div className="timeline-item">
                <div className="timeline-dot-glow"></div>
                <div className="timeline-content-box">
                  <div className="timeline-meta">
                    <span className="timeline-date">Nov 2021 - Present</span>
                  </div>
                  <h4 className="timeline-role">Product Designer</h4>
                  <div className="timeline-company-badge">ID/X Partners (ID/X Optus) | Jakarta</div>
                  <ul className="timeline-bullets">
                    <li>Joined as the founding Product Designer, establishing design vision, processes, and standards from the ground up — including logo redesign and full product rebranding.</li>
                    <li>Designed and shipped 20+ modules across the iDecision platform (onboarding, loan processing, collection, KYC, AML, fraud) deployed to multiple banking clients.</li>
                    <li>Led end-to-end redesign of the Collection Management module, restructuring field agent workflows and significantly reducing task-completion time.</li>
                    <li>Co-built a scalable design system of 30-40 components adopted by 3 engineering teams, improving design-dev handoff consistency and reducing rework.</li>
                    <li>Contributed to UX design for Financial Crime Management modules (AML, KYC, Fraud Detection) — a compliance-critical area with direct regulatory impact.</li>
                    <li>Enhanced the Form Generator within the LMS, enabling compliance officers to create regulated digital forms with fewer steps.</li>
                    <li>Co-designing an AI Assistant feature to augment credit analyst decision-making and user productivity.</li>
                    <li>Designed executive dashboards for the LMS to help management track lending KPIs and portfolio health in real time.</li>
                  </ul>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot-glow"></div>
                <div className="timeline-content-box">
                  <div className="timeline-meta">
                    <span className="timeline-date">Feb 2021 - Oct 2021</span>
                  </div>
                  <h4 className="timeline-role">UI/UX Designer</h4>
                  <div className="timeline-company-badge">Kleva | Bandung</div>
                  <ul className="timeline-bullets">
                    <li>Delivered end-to-end UI/UX design for 2 client products (FoodLive, Mastermin), covering 7-10 user flows each — from discovery and wireframing to high-fidelity prototypes.</li>
                    <li>Collaborated with UX writers and visual designers, translating client briefs into cohesive product experiences.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`app-container theme-${rgbTheme}`} ref={containerRef}>
      <div className="workstation-scene">
        <div className="background-image"></div>

        <div className="welcome-title">
          <h1>Welcome to Moses's</h1>
          <h2>Usability Lab</h2>
        </div>

        <AnimatePresence>
          {speechBubble && (
            <motion.div
              className="speech-bubble"
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ type: 'spring', damping: 15, stiffness: 220 }}
            >
              <div className="speech-content">{speechBubble}</div>
              <div className="speech-arrow"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showToolStack && (
            <motion.div
              className="toolstack-popup"
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 20 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            >
              <div className="toolstack-title">
                <Terminal size={12} /> DESIGN STACK
              </div>
              <div className="toolstack-grid">
                {tools.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    className="toolstack-item"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="toolstack-icon" dangerouslySetInnerHTML={{ __html: tool.icon }} />
                    <span className="toolstack-name">{tool.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quest Launching Overlay */}
        <AnimatePresence>
          {launchingQuest && (
            <motion.div
              className="quest-launch-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="quest-warp-container">
                <div className="quest-warp-ring"></div>
                <div className="quest-warp-ring"></div>
                <div className="quest-warp-ring"></div>
                <div className="quest-warp-ring"></div>
              </div>
              <div className="quest-launch-content">
                <div className="quest-launch-title">
                  <span className="quest-blink">HYPER-SPACE WARP INITIATED</span>
                </div>
                <div className="quest-launch-name">{launchingQuest.name}</div>
                <div className="quest-launch-bar-outer">
                  <motion.div
                    className="quest-launch-bar-inner"
                    style={{ width: `${questProgress}%` }}
                  />
                </div>
                <div className="quest-launch-percent">{questProgress}%</div>
                <div className="quest-launch-status">
                  {questProgress < 30 && 'BYPASSING FIREWALL...'}
                  {questProgress >= 30 && questProgress < 60 && 'UPLOADING DATA FRAGMENTS...'}
                  {questProgress >= 60 && questProgress < 90 && 'ACCESSING MAINFRAME...'}
                  {questProgress >= 90 && questProgress < 100 && 'SYNCHRONIZING PORTAL...'}
                  {questProgress >= 100 && 'WARP COMPLETE!'}
                </div>
                {questProgress >= 100 && (
                  <motion.div
                    className="quest-launch-flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0, 1, 0] }}
                    transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All hotspots... */}
        <div className="hotspot-zone hotspot-bookshelf" onClick={() => { handleTabChange('works'); openModal(); }} onMouseEnter={() => setSpeechBubble("Inspect my latest works and product design projects!")} onMouseLeave={() => setSpeechBubble(null)} title="Bookshelf (Methodology & Skills)">
          <span className="hotspot-hint">SKILLS</span>
        </div>
        <div className="hotspot-zone hotspot-posters" onClick={() => { handleTabChange('about'); openModal(); }} onMouseEnter={() => setSpeechBubble("Read my background story & bio!")} onMouseLeave={() => setSpeechBubble(null)} title="Lab Posters">
          <span className="hotspot-hint">BIO</span>
        </div>
        <div className="hotspot-zone hotspot-gameboy" onClick={() => { playClickSound(1000, 0.08, 'triangle'); setSpeechBubble("You powered on the retro Game Boy! Synthesizing 8-bit sound triggered! 🎮"); setTimeout(() => setSpeechBubble(null), 3000); }} onMouseEnter={() => setSpeechBubble("Play vintage console games!")} onMouseLeave={() => setSpeechBubble(null)} title="Game Boy">
          <span className="hotspot-hint">PLAY</span>
        </div>
        <div className="monitor-glow clickable-monitor hotspot-monitor" onClick={() => { handleTabChange('about'); openModal(); }} onMouseEnter={() => setSpeechBubble("Click the workstation screen to open my control dashboard!")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="monitor-hint">click to know more about me</span>
        </div>
        <div className="hotspot-zone hotspot-stats-screen" onClick={() => { handleTabChange('works'); openModal(); }} onMouseEnter={() => setSpeechBubble("Inspect system telemetries and works gallery!")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">telemetry</span>
        </div>
        <div className="hotspot-zone hotspot-pc-rig" onClick={toggleRgbTheme} onMouseEnter={() => setSpeechBubble("Click my watercooled server rig to cycle laboratory RGB lights! ⚡")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">RGB cycle</span>
        </div>
        <div className="hotspot-zone hotspot-tablet" onClick={() => { handleTabChange('works'); openModal(); }} onMouseEnter={() => setSpeechBubble("Examine my product design projects and Figma design systems!")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">design systems</span>
        </div>
        <div className="hotspot-zone hotspot-sketchbook" onClick={() => { handleTabChange('experience'); openModal(); }} onMouseEnter={() => setSpeechBubble("Browse my professional UI/UX design history questline!")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">quests</span>
        </div>
        <div className="hotspot-zone hotspot-mascot-left" onClick={() => { playClickSound(900, 0.1, 'sawtooth'); setSpeechBubble("Beep boop! This is Moses's mini-Gundam defender! 🤖🛡️"); setTimeout(() => setSpeechBubble(null), 4000); }} onMouseEnter={() => setSpeechBubble("Inspect mini robot toy")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">GUNDAM</span>
        </div>
        <div className="hotspot-zone hotspot-mascot-right" onClick={() => { playClickSound(1200, 0.08, 'sine'); setSpeechBubble("I am Moses's coding companion! Click me for debugging wisdom! 🐛✨"); setTimeout(() => setSpeechBubble(null), 4000); }} onMouseEnter={() => setSpeechBubble("Inspect desktop mascot")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">MASCOT</span>
        </div>
        <div className="hotspot-zone hotspot-keyboard" onClick={() => { const notes = [1300, 1400, 1500, 1600]; const randomNote = notes[Math.floor(Math.random() * notes.length)]; playClickSound(randomNote, 0.04, 'triangle'); setSpeechBubble("Moses types at 120 WPM! Clack clack clack! ⌨️⚡"); setTimeout(() => setSpeechBubble(null), 3000); }} onMouseEnter={() => setSpeechBubble("Type on mechanical keyboard")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">KEYBOARD</span>
        </div>
        <div className="hotspot-zone hotspot-window" onClick={() => { playClickSound(500, 0.15, 'sine'); setSpeechBubble("Moses's Usability Lab is situated high above Neo-Jakarta. The view fuels creative designs! 🌃🚀"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Look out the window")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">VIEW CITY</span>
        </div>
        <div className="hotspot-zone hotspot-drawers" onClick={() => { playClickSound(400, 0.12, 'sawtooth'); setSpeechBubble("Full of design sketches, wireframe templates, and a collection of vintage retro gaming cartridges! 📂🎮"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Open desk drawers")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">DRAWERS</span>
        </div>
        <div className="hotspot-zone hotspot-phones" onClick={() => { playClickSound(2000, 0.15, 'sine'); setSpeechBubble("Mobile device testing rack! Used to verify LMS responsiveness on real iOS & Android screens. 📱🧪"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Inspect mobile testing rack")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">TEST DEVICES</span>
        </div>
        <div className="hotspot-zone hotspot-lamp" onClick={() => { playClickSound(180, 0.05, 'triangle'); setSpeechBubble("A classic vintage desk lamp. Keeping the workspace warm during late-night design quests! 💡✨"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Inspect desk lamp")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">DESK LAMP</span>
        </div>
        <div className="hotspot-zone hotspot-servers" onClick={() => { playClickSound(1000, 0.05, 'sine'); setTimeout(() => playClickSound(1200, 0.05, 'sine'), 80); setSpeechBubble("Server units hosting secure digital lending sandboxes and telemetry APIs! 🌐💾"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Inspect rackmount servers")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">SERVERS</span>
        </div>
        <div className="hotspot-zone hotspot-toolbox" onClick={() => { setShowToolStack(prev => !prev); playClickSound(1200, 0.06, 'sine'); }} onMouseEnter={() => setSpeechBubble("Open toolbox to see my design stack tools!")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">TOOLBOX</span>
        </div>
        <div className="hotspot-zone hotspot-books" onClick={() => { playClickSound(450, 0.08, 'triangle'); setSpeechBubble("Books on UX Research, design systems, cognitive psychology, and fintech architecture. 📖🎓"); setTimeout(() => setSpeechBubble(null), 5000); }} onMouseEnter={() => setSpeechBubble("Read reference books")} onMouseLeave={() => setSpeechBubble(null)}>
          <span className="hotspot-hint">BOOKS</span>
        </div>
        <div className={`character-container clickable-character ${isLookingRight ? 'look-right' : 'look-left'}`}
          onClick={() => { handleTabChange('about'); openModal(); }}
          onMouseEnter={() => setSpeechBubble("Hi, I'm Moses! Click me to read my professional bio.")}
          onMouseLeave={() => setSpeechBubble(null)}>
          <img src={isLookingRight ? lookingRight : lookingLeft} alt="Character" className="character" />
        </div>
      </div>

      {/* Glassmorphism Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="popup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <motion.div className="glass-popup" initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 200 }} onClick={(e) => e.stopPropagation()}>
              <button className="popup-close-btn" onClick={closeModal} aria-label="Close popup">
                <X size={16} />
              </button>
              <div className="popup-header">
                <h2>WORKSPACE // SYSTEM CONTROL</h2>
                <div className="popup-tabs">
                  <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleTabChange('about')}><User size={13} /> ABOUT ME</button>
                  <button className={`tab-btn ${activeTab === 'works' ? 'active' : ''}`} onClick={() => handleTabChange('works')}><Briefcase size={13} /> MY WORKS</button>
                  <button className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`} onClick={() => handleTabChange('experience')}><Award size={13} /> EXPERIENCE</button>
                </div>
              </div>
              <div className="popup-body">{renderTabContent()}</div>
              <div className="popup-footer">
                <span className="footer-status"><Activity size={10} className="pulse-icon" /> CPU TEMP: 42°C // MEM: 512KB // SYS: ACTIVE</span>
                <span className="footer-copyright">
                  © 2026 WORKSPACE.SYS
                  <a
                    href="/?admin=m0s3s-lab-2026"
                    title="System Admin"
                    style={{ marginLeft: 10, opacity: 0.2, fontSize: 11, textDecoration: 'none', color: 'inherit', transition: 'opacity 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.2'}
                  >🔐</a>
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest Showcase Screen */}
      <AnimatePresence>
        {activeQuest && (
          <motion.div
            className="quest-showcase-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderQuestShowcase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;