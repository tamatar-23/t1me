import { useState, useEffect } from 'react';
import {
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import './index.css';

const STOCKS = [
  'BAJFINANCE', 'BHARTIARTL', 'HDFCBANK', 'ICICIBANK', 'INFY',
  'ITC', 'LT', 'RELIANCE', 'SBIN', 'TCS'
];

function indexToTime(i) {
  const total = 9 * 60 + 15 + i;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 0,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 11,
    color: '#fff',
  },
  labelStyle: { color: '#555', marginBottom: 4 },
  itemStyle: { color: '#fff' },
};

export default function App() {
  const [selected, setSelected]   = useState(STOCKS[0]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStockData(null);

    fetch(`/data/${selected}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`No data found for ${selected}. Run the evaluation pipeline first.`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        const chartData = data.actual.map((val, i) => ({
          time: indexToTime(i),
          Actual:    +val.toFixed(2),
          Predicted: +data.predicted[i].toFixed(2),
          Delta:     +(Math.abs(val - data.predicted[i])).toFixed(2),
        }));
        setStockData({ ...data, chartData });
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selected]);

  const XAXIS_PROPS = {
    dataKey: 'time',
    stroke: '#1e1e1e',
    tick: { fill: '#444', fontSize: 10, fontFamily: 'Plus Jakarta Sans' },
    minTickGap: 60,
    interval: 'preserveStartEnd',
  };
  const YAXIS_PROPS = {
    stroke: '#1e1e1e',
    tick: { fill: '#444', fontSize: 10, fontFamily: 'Plus Jakarta Sans' },
    domain: ['auto', 'auto'],
    width: 70,
  };

  return (
    <div className="app">

      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">T1ME_Nifty50</span>
          <span className="brand-sub">360-Min Prediction Verifier</span>
        </div>
        <div className="topbar-right">
          <span className="select-label">Stock</span>
          <select
            className="stock-select"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </header>

      {/* ── DUAL CHART PANELS ── */}
      <div className="main-grid">

        {/* LEFT – MODEL vs ACTUAL */}
        <section className="panel">
          <div className="panel-header">
            <span className="panel-tag">Model</span>
            <span className="panel-title">Predicted vs Actual — {selected}</span>
          </div>
          <div className="panel-body">
            {loading && <div className="state-msg">Loading…</div>}
            {error   && <div className="state-msg error">{error}</div>}
            {stockData && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockData.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                  <XAxis {...XAXIS_PROPS} />
                  <YAxis {...YAXIS_PROPS} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line dataKey="Actual"    stroke="#ffffff" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#fff', strokeWidth: 0 }} />
                  <Line dataKey="Predicted" stroke="#4d94ff" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 3, fill: '#4d94ff', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* RIGHT – ACTUAL PRICE (Recharts Fill) */}
        <section className="panel">
          <div className="panel-header">
            <span className="panel-tag blue-tag">TV</span>
            <span className="panel-title">Actual Price Trajectory — {selected}</span>
          </div>
          <div className="panel-body">
            {loading && <div className="state-msg">Loading…</div>}
            {error   && <div className="state-msg error">{error}</div>}
            {stockData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockData.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 4" stroke="#111" vertical={false} />
                  <XAxis {...XAXIS_PROPS} />
                  <YAxis {...YAXIS_PROPS} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area
                    dataKey="Actual"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* ── STATS FOOTER ── */}
      <footer className="stats-footer">
        <div className="stats-label-col">
          <span className="stats-heading">Model Analysis</span>
          <span className="stats-stock-name">{selected}</span>
          <span className="stats-window">360-Min Window · 9:15 AM – 3:15 PM</span>
        </div>
        <div className="stats-grid">
          {stockData ? (
            <>
              <div className="stat-cell">
                <span className="stat-cell-label">MSE</span>
                <span className="stat-cell-value">{stockData.mse.toExponential(3)}</span>
                <span className="stat-cell-desc">Mean Squared Error</span>
              </div>
              <div className="stat-cell">
                <span className="stat-cell-label">MAE</span>
                <span className="stat-cell-value">{stockData.mae.toExponential(3)}</span>
                <span className="stat-cell-desc">Mean Absolute Error</span>
              </div>
              <div className="stat-cell">
                <span className="stat-cell-label">R²</span>
                <span className="stat-cell-value">{stockData.r2.toFixed(4)}</span>
                <span className="stat-cell-desc">Variance explained by model</span>
              </div>
            </>
          ) : (
            <div className="stats-empty">
              {loading ? 'Fetching metrics…' : error ? 'Run the evaluation pipeline to populate this section.' : ''}
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
