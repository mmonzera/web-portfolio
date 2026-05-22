// Retro Sound Effects synthesizer using Web Audio API
// No assets required - 100% synthesized in-browser

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. CRT Power-On / Boot sound
export function playBootSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // A low power-on hum that quickly ramps up and clicks
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    
    // Quick pitch rise mimicking static charging
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.35);
    
    // Click sound at the end
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.45);

    // High pitch crisp spark (click) at 0.35s
    setTimeout(() => {
      playClickSound(1800, 0.04, 'triangle');
    }, 350);

  } catch (e) {
    console.warn("Audio context failed to start:", e);
  }
}

// 2. Standard retro menu blip / click sound
export function playClickSound(freq = 800, duration = 0.08, type = 'sine') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    // Retro drop-pitch effect
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch (e) {
    console.warn("Sound play error:", e);
  }
}

// 3. Tab select click (subtle mechanical keyboard switch)
export function playTabSound() {
  // A mechanical keyboard blue-switch click is a combination of two quick transients
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // High click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.setValueAtTime(1600, now + 0.01);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.04);
  } catch (e) {
    // Fail silently
  }
}

// 4. Downward sweep close sound
export function playCloseSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {
    // Fail silently
  }
}

// 5. RGB Switch (PC Power / Theme change) sound
export function playRgbSwitchSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Relay click
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(300, now);
    oscClick.frequency.exponentialRampToValueAtTime(150, now + 0.05);
    gainClick.gain.setValueAtTime(0.15, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    
    oscClick.start(now);
    oscClick.stop(now + 0.06);
    
    // Fan speed whir (quick pitch rise and fall)
    const oscFan = ctx.createOscillator();
    const gainFan = ctx.createGain();
    oscFan.type = 'sine';
    oscFan.frequency.setValueAtTime(100, now);
    oscFan.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    oscFan.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    
    gainFan.gain.setValueAtTime(0, now);
    gainFan.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gainFan.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    oscFan.connect(gainFan);
    gainFan.connect(ctx.destination);
    
    oscFan.start(now);
    oscFan.stop(now + 0.31);
  } catch (e) {
    // Fail silently
  }
}

// 6. Epic 8-bit Quest Start Fanfare (NES-style C-Major arpeggio)
export function playQuestStartSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, now + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.25);
    });
  } catch (e) {
    // Fail silently
  }
}

// 7. Retro 8-bit Start Game Sound (Insert Coin + Ascent Fanfare)
export function playStartGameSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Coin insert sound (B5: 987.77Hz followed by E6: 1318.51Hz very quickly)
    const oscCoin = ctx.createOscillator();
    const gainCoin = ctx.createGain();
    
    oscCoin.type = 'square';
    oscCoin.frequency.setValueAtTime(987.77, now);
    oscCoin.frequency.setValueAtTime(1318.51, now + 0.08);
    
    gainCoin.gain.setValueAtTime(0, now);
    gainCoin.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gainCoin.gain.setValueAtTime(0.08, now + 0.12);
    gainCoin.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    oscCoin.connect(gainCoin);
    gainCoin.connect(ctx.destination);
    
    oscCoin.start(now);
    oscCoin.stop(now + 0.36);
    
    // Triumphant Ascent Arpeggio starting slightly after the coin sound
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4, G4, C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Use square for arpeggio to give that crunch classic retro feel
      osc.type = index % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.28 + index * 0.06);
      
      gain.gain.setValueAtTime(0, now + 0.28 + index * 0.06);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.28 + index * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + index * 0.06 + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + 0.28 + index * 0.06);
      osc.stop(now + 0.28 + index * 0.06 + 0.25);
    });
  } catch (e) {
    // Fail silently
  }
}

