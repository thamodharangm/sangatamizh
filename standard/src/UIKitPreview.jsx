import React, { useState } from 'react';
import './uikit.css';

const UIKitPreview = () => {
  const [theme, setTheme] = useState('light');
  const [toggle, setToggle] = useState(true);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const colors = [
    { name: 'Primary Green', hex: '#58CC02', depth: '#46A302' },
    { name: 'Primary Blue', hex: '#1CB0F6', depth: '#1899D6' },
    { name: 'Accent Pink', hex: '#FF4B4B', depth: '#D13B3B' },
    { name: 'Accent Yellow', hex: '#FFC800', depth: '#E5A500' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', padding: '3rem 5%', transition: 'background 0.3s' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--color-gray-dark)', fontSize: '2.5rem' }}>Sangatamizh Master UI Kit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '5px' }}>Duo-Tactile Design System for Full Stack Apps</p>
        </div>
        <button onClick={toggleTheme} className="btn-tactile btn-secondary" style={{ height: '44px' }}>
          Switch to {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
        
        {/* Left Column: Foundations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Color Palette */}
          <section className="card-tactile">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Color Palette</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {colors.map(c => (
                <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '60px', background: c.hex, borderRadius: '12px', border: '2px solid rgba(0,0,0,0.05)', boxShadow: `0 4px 0 ${c.depth}` }}></div>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-gray-dark)' }}>{c.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.hex}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="card-tactile">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Typography</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h1 style={{ fontSize: '2rem' }}>Heading 1 (2rem)</h1>
              <h2 style={{ fontSize: '1.5rem' }}>Heading 2 (1.5rem)</h2>
              <h3 style={{ fontSize: '1.25rem' }}>Heading 3 (1.25rem)</h3>
              <p style={{ color: 'var(--text-main)' }}>Body text for descriptions and general content.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Caption or muted metadata text style.</p>
            </div>
          </section>

          {/* Form Elements */}
          <section className="card-tactile">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Form Elements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>Search Enabled</span>
                <label className="toggle-tactile">
                  <input type="checkbox" checked={toggle} onChange={() => setToggle(!toggle)} />
                  <span className="slider"></span>
                </label>
              </div>
              <input 
                type="text" 
                placeholder="Search songs..." 
                style={{ width: '100%', height: '48px', borderRadius: '14px', border: '2px solid var(--border-light)', padding: '0 1rem', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600 }}
              />
              <div className="progress-tactile">
                <div className="progress-tactile-fill" style={{ width: '65%', background: 'var(--color-green)' }}></div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Components & Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Buttons */}
          <section className="card-tactile">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Buttons System</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-tactile btn-green">Primary Green</button>
              <button className="btn-tactile btn-blue">Primary Blue</button>
              <button className="btn-tactile btn-secondary">Secondary White</button>
              <button className="btn-tactile btn-green" style={{ background: 'var(--color-pink)', boxShadow: '0 5px 0 var(--color-pink-depth)' }}>Error/Delete</button>
            </div>
          </section>

          {/* Cards & Items */}
          <section>
             <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Cards & Item Templates</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Song Card */}
                <div className="card-tactile" style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#f0f0f0', borderRadius: '15px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2rem' }}>🎵</div>
                  </div>
                  <h4 style={{ fontWeight: 900, marginBottom: '2px' }}>Aaluma Doluma</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Anirudh Ravichander</p>
                  <button className="btn-tactile btn-blue" style={{ width: '100%', height: '40px', marginTop: '1rem', fontSize: '0.8rem' }}>PLAY</button>
                </div>

                {/* Stats Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div className="card-tactile" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '6px solid var(--color-yellow)' }}>
                      <div style={{ fontSize: '1.5rem' }}>🔥</div>
                      <div>
                        <h4 style={{ fontWeight: 900 }}>15 Day Streak</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Keep listening daily!</p>
                      </div>
                   </div>
                   <div className="card-tactile" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '6px solid var(--color-green)' }}>
                      <div style={{ fontSize: '1.5rem' }}>📈</div>
                      <div>
                        <h4 style={{ fontWeight: 900 }}>Standard Analytics</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>4.2k Plays this month</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Navigation Preview */}
          <section className="card-tactile">
             <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-gray-dark)' }}>Navigation Archetypes</h3>
             <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '15px', border: '2px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '12px', border: '2px solid var(--border-light)', boxShadow: '0 4px 0 var(--border-light)' }}>
                   <div style={{ color: 'var(--color-green)', fontSize: '1.5rem' }}>🏠</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>🔍</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>❤️</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>⚙️</div>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default UIKitPreview;
