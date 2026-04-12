import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate a sine-wave-like stock chart that animates
    const points = [];
    const pointCount = 120;
    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: i,
        y: 0,
        baseY: Math.sin(i * 0.08) * 40 + Math.sin(i * 0.03) * 20 + Math.random() * 10,
      });
    }

    // Floating particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset += 0.015;

      // Draw floating particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77, 148, 255, ${p.opacity})`;
        ctx.fill();
      });

      // Draw animated stock line
      const centerY = canvas.height * 0.5;
      const scaleX = canvas.width / (pointCount - 1);

      ctx.beginPath();
      points.forEach((p, i) => {
        const y = centerY + p.baseY + Math.sin(offset + i * 0.05) * 15;
        const x = i * scaleX;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(77, 148, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill gradient under line
      const lastPoint = points[points.length - 1];
      const lastY = centerY + lastPoint.baseY + Math.sin(offset + (pointCount - 1) * 0.05) * 15;
      ctx.lineTo((pointCount - 1) * scaleX, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, centerY - 60, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(77, 148, 255, 0.06)');
      gradient.addColorStop(1, 'rgba(77, 148, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw a second prediction line (dashed effect)
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      points.forEach((p, i) => {
        const y = centerY + p.baseY + Math.sin(offset + i * 0.05) * 15 + Math.sin(i * 0.12) * 8 - 5;
        const x = i * scaleX;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="home">
      <canvas ref={canvasRef} className="home-canvas" />

      {/* Nav */}
      <nav className="home-nav">
        <span className="home-brand">T1ME</span>
        <div className="home-nav-links">
          <Link to="/dashboard" className="home-nav-cta">
            Launch Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="home-hero">
        <div className="home-hero-content">
          <div className="home-badge">
            <span className="home-badge-dot" />
            Time Series LLM Framework
          </div>

          <h1 className="home-title">
            <span className="home-title-gradient">T1ME</span>
            <span className="home-title-sub">Nifty50</span>
          </h1>

          <p className="home-description">
            A highly specialized framework that repurposes pre-trained Large Language Models — 
            GPT-2 and LLaMA — for <strong>high-frequency financial forecasting</strong>. 
            By treating continuous price movements as discrete tokens, T1ME projects 
            entire 360-minute trading windows with <strong>zero-shot generalization</strong> capabilities, 
            achieving R² &gt; 0.999 on Nifty 50 index stocks.
          </p>

          <div className="home-features">
            <div className="home-feature">
              <div className="home-feature-icon">📊</div>
              <div className="home-feature-text">
                <span className="home-feature-label">Long-Term Forecasting</span>
                <span className="home-feature-desc">Predict multi-hour trajectories from historical patches using frozen transformer attention</span>
              </div>
            </div>
            <div className="home-feature">
              <div className="home-feature-icon">🧠</div>
              <div className="home-feature-text">
                <span className="home-feature-label">LLM-Powered Analysis</span>
                <span className="home-feature-desc">Leverages GPT-2 semantic blocks — treating financial momentum as language extrapolation</span>
              </div>
            </div>
            <div className="home-feature">
              <div className="home-feature-icon">⚡</div>
              <div className="home-feature-text">
                <span className="home-feature-label">Real-Time Dashboard</span>
                <span className="home-feature-desc">Brutalist React interface overlaying actual vs predicted price trajectories with live metrics</span>
              </div>
            </div>
          </div>

          <div className="home-cta-group">
            <Link to="/dashboard" className="home-cta-primary" id="launch-dashboard-btn">
              <span>Open Prediction Dashboard</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

          </div>
        </div>

        {/* Stats strip */}
        <div className="home-stats-strip">
          <div className="home-stat">
            <span className="home-stat-value">10</span>
            <span className="home-stat-label">Nifty 50 Stocks</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">360</span>
            <span className="home-stat-label">Min Prediction Window</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">&gt;0.999</span>
            <span className="home-stat-label">R² Score (Zero-Shot)</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">GPT-2</span>
            <span className="home-stat-label">Backbone Model</span>
          </div>
        </div>
      </main>

      {/* Tech Strip */}
      <footer className="home-footer">
        <div className="home-tech-row">
          <span className="home-tech-item">React 19</span>
          <span className="home-tech-dot">·</span>
          <span className="home-tech-item">Vite</span>
          <span className="home-tech-dot">·</span>
          <span className="home-tech-item">Recharts</span>
          <span className="home-tech-dot">·</span>
          <span className="home-tech-item">PyTorch</span>
          <span className="home-tech-dot">·</span>
          <span className="home-tech-item">GPT-2</span>
          <span className="home-tech-dot">·</span>
          <span className="home-tech-item">Google Colab</span>
        </div>
        <p className="home-footer-text">
          T1ME_Nifty50 © 2026
        </p>
      </footer>
    </div>
  );
}
