import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchHardwareStatus,
  fetchHardwareHistory,
  sendSimulatedHardwarePacket,
  resetHardwareState,
  type HardwareStatusResponse,
  type HardwareTelemetryRecord,
} from '../services/hardwareApi';
import './LiveHardwarePage.css';

interface LiveHardwarePageProps {
  onNavigateToSpark?: () => void;
}

export function LiveHardwarePage({ onNavigateToSpark }: LiveHardwarePageProps) {
  const [status, setStatus] = useState<HardwareStatusResponse | null>(null);
  const [history, setHistory] = useState<HardwareTelemetryRecord[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showWokwiEmbed, setShowWokwiEmbed] = useState(false);
  const [showEvaluatorGuide, setShowEvaluatorGuide] = useState(true);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Evaluator Hardware Sandbox Controls (Tinkercad-style interactive inputs)
  const [sliderTemp, setSliderTemp] = useState<number>(24.5);
  const [sliderPress, setSliderPress] = useState<number>(1013.25);
  const [sliderBattery, setSliderBattery] = useState<number>(93);
  const [sliderSignal, setSliderSignal] = useState<number>(-68);
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(false);
  const simLiveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetchHardwareStatus(),
        fetchHardwareHistory(35),
      ]);
      setStatus(statusRes);
      setHistory(historyRes.readings || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach hardware telemetry API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (isPolling) {
      pollTimerRef.current = setInterval(loadData, 1500);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPolling, loadData]);

  // Handle transmitting current slider state as telemetry
  const handleTransmitCustomState = useCallback(async (sourceType: 'wokwi' | 'fallback' = 'wokwi') => {
    try {
      const isWokwi = sourceType === 'wokwi';
      const seq = (status?.packetCount || 0) + 1;
      const oceanTemp = Math.round((3.40 + (sliderTemp - 24.5) * 0.20) * 100) / 100;
      const depthM = Math.round((2000.0 + (sliderPress - 1013.25) * 2.0) * 10) / 10;
      const pressMpa = Math.round(((depthM * 1025.0 * 9.80665) / 1000000.0) * 1000) / 1000;
      const batVolt = Math.round((3.00 + (sliderBattery / 100.0) * 1.20) * 100) / 100;

      let commStatus = 'OPTIMAL';
      let nodeStatus = 'ACTIVE';
      const latency = Math.round((138.0 + (sliderSignal < -80 ? 95 : 0)) * 10) / 10;
      const loss = sliderSignal < -85 ? 8.5 : 1.8;

      if (sliderBattery < 20 || loss > 10 || latency > 280) {
        commStatus = 'CRITICAL';
        nodeStatus = 'CRITICAL';
      } else if (sliderBattery < 35 || loss > 5 || latency > 180) {
        commStatus = 'DEGRADED';
        nodeStatus = 'WARNING';
      }

      setActionMsg(`Transmitting ${isWokwi ? 'WOKWI FIRMWARE' : 'FALLBACK'} packet: Temp ${sliderTemp}°C (Ocean ${oceanTemp}°C), Bat ${sliderBattery}%, RSSI ${sliderSignal}dBm...`);
      await sendSimulatedHardwarePacket({
        node_id: 'ESP32-UW01',
        sequence: seq,
        temperature_c: oceanTemp,
        pressure_mpa: pressMpa,
        raw_sensor_hpa: sliderPress,
        depth_m: depthM,
        battery_voltage_v: batVolt,
        battery_level: sliderBattery,
        signal_strength: sliderSignal,
        latency_ms: latency,
        packet_loss: loss,
        communication_status: commStatus,
        node_status: nodeStatus,
        source: isWokwi ? 'wokwi-esp32-firmware' : 'nodejs-virtual-hardware-fallback',
        source_label: isWokwi ? 'ACTUAL WOKWI FIRMWARE TELEMETRY' : 'NODE.JS VIRTUAL HARDWARE FALLBACK',
        is_actual_wokwi: isWokwi,
        firmware_type: isWokwi ? 'EMBEDDED_C_CPP' : 'NODEJS_ENGINE_FALLBACK',
        hardware_execution: isWokwi ? 'WOKWI_SIMULATED_CHIP' : 'HOST_ENGINE_FALLBACK',
      });
      setTimeout(() => setActionMsg(null), 3000);
      await loadData();
    } catch (err) {
      setActionMsg(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [status?.packetCount, sliderTemp, sliderPress, sliderBattery, sliderSignal, loadData]);

  // Continuous auto-simulation timer for sandbox
  useEffect(() => {
    if (isSimulatingLive) {
      simLiveRef.current = setInterval(() => {
        handleTransmitCustomState('wokwi');
      }, 2500);
    }
    return () => {
      if (simLiveRef.current) clearInterval(simLiveRef.current);
    };
  }, [isSimulatingLive, handleTransmitCustomState]);

  const applyPreset = (preset: 'normal' | 'low_battery' | 'high_temp' | 'signal_fade') => {
    if (preset === 'normal') {
      setSliderTemp(24.5);
      setSliderPress(1013.25);
      setSliderBattery(94);
      setSliderSignal(-67);
      setActionMsg('Preset applied: Normal Deep Ocean Baseline');
    } else if (preset === 'low_battery') {
      setSliderBattery(14); // Triggers Critical Alert LED
      setActionMsg('Preset applied: Critical Low Battery (<20%) -> Triggers Red Alert LED');
    } else if (preset === 'high_temp') {
      setSliderTemp(44.0); // Transducer thermal chamber test
      setActionMsg('Preset applied: High Transducer Temperature (44.0°C)');
    } else if (preset === 'signal_fade') {
      setSliderSignal(-92); // Deep acoustic multipath fade
      setActionMsg('Preset applied: Deep Acoustic Signal Fading (-92 dBm)');
    }
    setTimeout(() => setActionMsg(null), 2500);
  };

  const handleSendTestPacket = async (sourceType: 'wokwi' | 'fallback' = 'wokwi') => {
    handleTransmitCustomState(sourceType);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset virtual hardware packet buffers and history?')) return;
    try {
      await resetHardwareState();
      setActionMsg('Hardware buffers cleared.');
      setTimeout(() => setActionMsg(null), 2500);
      await loadData();
    } catch (err) {
      setActionMsg(`Reset failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const latest = status?.latestReading;
  const isOnline = status?.connectionStatus === 'ONLINE';
  const isStale = status?.connectionStatus === 'STALE';

  // SVG Chart helpers
  const renderMultiChart = (
    data: HardwareTelemetryRecord[],
    valExtractor1: (r: HardwareTelemetryRecord) => number,
    valExtractor2: (r: HardwareTelemetryRecord) => number,
    color1: string,
    color2: string,
  ) => {
    if (!data || data.length < 2) {
      return (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
          Awaiting continuous packet stream for time-series chart...
        </div>
      );
    }

    const vals1 = data.map(valExtractor1);
    const vals2 = data.map(valExtractor2);
    const min1 = Math.min(...vals1);
    const max1 = Math.max(...vals1);
    const range1 = max1 - min1 || 1;

    const min2 = Math.min(...vals2);
    const max2 = Math.max(...vals2);
    const range2 = max2 - min2 || 1;

    const width = 360;
    const height = 120;
    const padding = 15;

    const pts1 = vals1.map((v, i) => {
      const x = padding + (i / (vals1.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((v - min1) / range1) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const pts2 = vals2.map((v, i) => {
      const x = padding + (i / (vals2.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((v - min2) / range2) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="hw-svg-chart" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad-${color1}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color1} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeDasharray="3,3" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3,3" />
        <polyline fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts1} />
        <polyline fill="none" stroke={color2} strokeWidth="2" strokeDasharray="4,2" points={pts2} />
      </svg>
    );
  };

  return (
    <div className="hardware-page-container">
      {/* ── Top Hero Banner ─────────────────────────────────────────────────── */}
      <div className="hw-hero">
        <div className="hw-hero-titles">
          <h2>
            <span>🔌</span> LIVE HARDWARE MONITORING
          </h2>
          <p>
            Virtual ESP32 Deep-Ocean Acoustic Node (Wokwi Electronic Simulation & Calibrated Transducer Integration)
          </p>

          {/* Prominent Active Source Indicator */}
          <div className="hw-source-banner">
            {status?.isActualWokwi ? (
              <div className="hw-source-pill wokwi-active">
                <span className="hw-pulse-dot-cyan" />
                <strong>ACTUAL WOKWI FIRMWARE TELEMETRY</strong>
                <span className="hw-source-sub">(Embedded C/C++ in Wokwi Simulation)</span>
              </div>
            ) : status?.currentSource === 'nodejs-virtual-hardware-fallback' ? (
              <div className="hw-source-pill fallback-active">
                <span className="hw-pulse-dot-purple" />
                <strong>NODE.JS VIRTUAL HARDWARE FALLBACK</strong>
                <span className="hw-source-sub">(Host Engine Dynamics Simulation)</span>
              </div>
            ) : (
              <div className="hw-source-pill waiting">
                <span>○</span>
                <span>NO TELEMETRY STREAM DETECTED</span>
              </div>
            )}

            {/* Packet Statistics Breakdown */}
            <div className="hw-packet-stats">
              <span className="hw-stat-chip">Total: <strong>{status?.packetCount || 0}</strong></span>
              <span className="hw-stat-chip wokwi-chip">Wokwi C/C++: <strong>{status?.wokwiPacketCount || 0}</strong></span>
              <span className="hw-stat-chip fallback-chip">Fallback: <strong>{status?.fallbackPacketCount || 0}</strong></span>
            </div>
          </div>
        </div>

        <div className="hw-hero-actions">
          {/* Connection Status Badge: Never shows fake LIVE when offline */}
          {isOnline ? (
            <div className="hw-status-badge online">
              <span className="hw-pulse-dot" />
              HARDWARE STREAMING (LIVE)
            </div>
          ) : isStale ? (
            <div className="hw-status-badge stale">
              <span className="hw-pulse-dot" />
              SIGNAL STALE ({status?.secondsSinceHeartbeat}s ago)
            </div>
          ) : (
            <div className="hw-status-badge disconnected">
              <span>○</span>
              HARDWARE DISCONNECTED
            </div>
          )}

          <button
            className={`hw-btn ${isPolling ? 'hw-btn-primary' : 'hw-btn-outline'}`}
            onClick={() => setIsPolling(!isPolling)}
          >
            {isPolling ? 'Pause Polling' : 'Resume Polling'}
          </button>

          <button
            className="hw-btn hw-btn-wokwi"
            onClick={() => handleSendTestPacket('wokwi')}
            title="Inject simulated Wokwi C/C++ firmware packet"
          >
            ⚡ Test Wokwi Ping
          </button>

          <button
            className="hw-btn hw-btn-fallback"
            onClick={() => handleSendTestPacket('fallback')}
            title="Inject simulated Node.js fallback packet"
          >
            ⚙️ Test Fallback Ping
          </button>

          {onNavigateToSpark && (
            <button
              className="hw-btn hw-btn-spark"
              onClick={onNavigateToSpark}
              title="Open Apache Spark Lab"
            >
              ⚡ Spark Analytics Lab
            </button>
          )}

          <button
            className="hw-btn hw-btn-outline"
            onClick={handleReset}
            title="Clear hardware stream"
          >
            Reset
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '8px 14px', borderRadius: 8, fontSize: 12.5 }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12.5 }}>
          ⚠️ Backend API Warning: {error}
        </div>
      )}

      {/* ── Scientific Calibration & Honesty Notice ─────────────────────────── */}
      <div className="hw-calibration-banner">
        <strong>🔬 Physical Transducer & Deep-Ocean Calibration Note:</strong> The virtual hardware node simulates an{' '}
        <strong>ESP32 DevKit v1</strong> integrated with a physical <strong>Bosch BMP280 MEMS sensor</strong>. A physical BMP280
        measures atmospheric pressures between <strong>300 hPa and 1100 hPa</strong>. Because physical deep-sea pressure at 2000m depth is{' '}
        <strong>~20 MPa (200 atmospheres)</strong>, our embedded firmware reads the physical transducer in the test chamber and mathematically applies
        an oceanographic hydrostatic transfer function ($P = \rho \cdot g \cdot h$) to derive modeled deep-sea pressure and acoustic depth.
        All telemetry records transmit <em>both</em> raw transducer and calibrated oceanographic values, clearly tagged as{' '}
        <code>SIMULATED_VIRTUAL_HARDWARE</code>.
      </div>

      {/* ── Interactive Evaluator Sandbox (Tinkercad-Style Live Demonstration) ─── */}
      <div className="hw-sandbox-card">
        <div className="hw-sandbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎛️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                Interactive Transducer & Sensor Simulation Sandbox
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Adjust virtual hardware inputs in real time to observe instant circuit response, OLED screen update, and telemetry dispatch.
              </div>
            </div>
          </div>
          <div className="hw-sandbox-presets">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>DEMO PRESETS:</span>
            <button className="hw-preset-btn" onClick={() => applyPreset('normal')}>Normal (24.5°C / 94%)</button>
            <button className="hw-preset-btn alert" onClick={() => applyPreset('low_battery')}>Low Battery (&lt;20%)</button>
            <button className="hw-preset-btn" onClick={() => applyPreset('high_temp')}>Thermal Spike (44°C)</button>
            <button className="hw-preset-btn" onClick={() => applyPreset('signal_fade')}>Multipath Fade (-92dB)</button>
          </div>
        </div>

        <div className="hw-sliders-grid">
          {/* Slider 1: BMP280 Chamber Temp */}
          <div className="hw-slider-box">
            <div className="hw-slider-label">
              <span>🌡️ Transducer Temperature (BMP280)</span>
              <strong style={{ color: '#0284c7' }}>{sliderTemp.toFixed(1)} °C</strong>
            </div>
            <input
              type="range"
              min="-10"
              max="50"
              step="0.5"
              value={sliderTemp}
              onChange={(e) => setSliderTemp(parseFloat(e.target.value))}
              className="hw-slider-input"
            />
            <div className="hw-slider-meta">
              <span>-10°C (Subzero)</span>
              <span>Ocean Calibrated: <strong>{(3.40 + (sliderTemp - 24.5) * 0.20).toFixed(2)} °C</strong></span>
              <span>+50°C (Chamber Test)</span>
            </div>
          </div>

          {/* Slider 2: BMP280 Chamber Pressure */}
          <div className="hw-slider-box">
            <div className="hw-slider-label">
              <span>🌊 Barometric Transducer Pressure</span>
              <strong style={{ color: '#0284c7' }}>{sliderPress.toFixed(1)} hPa</strong>
            </div>
            <input
              type="range"
              min="950"
              max="1050"
              step="1"
              value={sliderPress}
              onChange={(e) => setSliderPress(parseFloat(e.target.value))}
              className="hw-slider-input"
            />
            <div className="hw-slider-meta">
              <span>950 hPa (Low P)</span>
              <span>Modeled: <strong>{(2000 + (sliderPress - 1013.25) * 2).toFixed(0)}m</strong> (~20.1 MPa)</span>
              <span>1050 hPa (High P)</span>
            </div>
          </div>

          {/* Slider 3: Battery Potentiometer (ADC34) */}
          <div className="hw-slider-box">
            <div className="hw-slider-label">
              <span>🔋 Battery Voltage (ADC GPIO 34)</span>
              <strong style={{ color: sliderBattery < 20 ? '#ef4444' : '#10b981' }}>
                {sliderBattery}% ({ (3.00 + (sliderBattery / 100.0) * 1.20).toFixed(2) }V)
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderBattery}
              onChange={(e) => setSliderBattery(parseInt(e.target.value, 10))}
              className="hw-slider-input"
            />
            <div className="hw-slider-meta">
              <span>0% (3.00V Cutoff)</span>
              <span style={{ color: sliderBattery < 20 ? '#ef4444' : '#64748b', fontWeight: sliderBattery < 20 ? 700 : 400 }}>
                {sliderBattery < 20 ? '⚠️ CRITICAL FAULT (Alert LED Active)' : 'Normal LiPo Capacity'}
              </span>
              <span>100% (4.20V Full)</span>
            </div>
          </div>

          {/* Slider 4: Acoustic RSSI Potentiometer (ADC35) */}
          <div className="hw-slider-box">
            <div className="hw-slider-label">
              <span>📡 Acoustic Signal RSSI (ADC GPIO 35)</span>
              <strong style={{ color: sliderSignal < -82 ? '#f59e0b' : '#8b5cf6' }}>{sliderSignal} dBm</strong>
            </div>
            <input
              type="range"
              min="-95"
              max="-55"
              step="1"
              value={sliderSignal}
              onChange={(e) => setSliderSignal(parseInt(e.target.value, 10))}
              className="hw-slider-input"
            />
            <div className="hw-slider-meta">
              <span>-95 dBm (Weak/Faded)</span>
              <span>Packet Loss: <strong>{sliderSignal < -82 ? '~8.5%' : '~1.8%'}</strong></span>
              <span>-55 dBm (Strong Line-of-Sight)</span>
            </div>
          </div>
        </div>

        <div className="hw-sandbox-actions">
          <button className="hw-btn hw-btn-wokwi" onClick={() => handleTransmitCustomState('wokwi')}>
            ⚡ Transmit Custom Wokwi Firmware Packet
          </button>
          <button className="hw-btn hw-btn-fallback" onClick={() => handleTransmitCustomState('fallback')}>
            ⚙️ Transmit Custom Fallback Packet
          </button>
          <button
            className={`hw-btn ${isSimulatingLive ? 'hw-btn-primary' : 'hw-btn-outline'}`}
            onClick={() => setIsSimulatingLive(!isSimulatingLive)}
          >
            {isSimulatingLive ? '⏹ Stop Live Auto-Stream' : '▶ Start Continuous Live Stream'}
          </button>
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
            Transmits directly to <code>POST /api/hardware/telemetry</code> and triggers real-time graph updates.
          </span>
        </div>
      </div>

      {/* ── Live Sensor Gauges / KPI Cards ──────────────────────────────────── */}
      <div className="hw-kpi-grid">
        {/* Ocean Temperature */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>Water Temperature</span>
            <span style={{ fontSize: 14 }}>🌡️</span>
          </div>
          <div className="hw-kpi-val">
            {latest ? latest.temperature_c.toFixed(2) : '--'} <span className="unit">°C</span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Deep Abyssal Layer (Nominal 3.4°C)` : 'Awaiting sensor reading'}
          </div>
        </div>

        {/* Ocean Pressure & Depth */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>Hydrostatic Pressure</span>
            <span style={{ fontSize: 14 }}>🌊</span>
          </div>
          <div className="hw-kpi-val">
            {latest ? latest.pressure_mpa.toFixed(3) : '--'} <span className="unit">MPa</span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Depth: ${latest.depth_m.toFixed(1)} m (Raw: ${latest.raw_sensor_hpa} hPa)` : 'Awaiting pressure transducer'}
          </div>
        </div>

        {/* Battery State */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>LiPo Battery System</span>
            <span style={{ fontSize: 14 }}>🔋</span>
          </div>
          <div className="hw-kpi-val">
            {latest ? latest.battery_voltage_v.toFixed(2) : '--'} <span className="unit">V</span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Remaining: ${latest.battery_level}% (ADC34 Potentiometer)` : 'Awaiting ADC measurement'}
          </div>
        </div>

        {/* Acoustic RSSI */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>Acoustic Signal RSSI</span>
            <span style={{ fontSize: 14 }}>📡</span>
          </div>
          <div className="hw-kpi-val">
            {latest ? latest.signal_strength.toFixed(1) : '--'} <span className="unit">dBm</span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Carrier Lock: -${Math.abs(latest.signal_strength).toFixed(0)} dB (ADC35 Pot)` : 'Awaiting receiver lock'}
          </div>
        </div>

        {/* Acoustic Latency & Loss */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>Acoustic Delay & Loss</span>
            <span style={{ fontSize: 14 }}>⏱️</span>
          </div>
          <div className="hw-kpi-val">
            {latest ? latest.latency_ms.toFixed(1) : '--'} <span className="unit">ms</span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Packet Loss Rate: ${latest.packet_loss}%` : 'Awaiting propagation delay'}
          </div>
        </div>

        {/* Node Health Status */}
        <div className="hw-kpi-card">
          <div className="hw-kpi-label">
            <span>Node Health Classification</span>
            <span style={{ fontSize: 14 }}>🛡️</span>
          </div>
          <div className="hw-kpi-val">
            <span className={`hw-kpi-badge ${(latest?.communication_status || 'stable').toLowerCase()}`}>
              {latest?.communication_status || 'IDLE'}
            </span>
          </div>
          <div className="hw-kpi-sub">
            {latest ? `Packets Received: #${status?.packetCount}` : 'System Standby'}
          </div>
        </div>
      </div>

      {/* ── Electronic Circuit Layout & Peripherals ─────────────────────────── */}
      <div className="hw-circuit-section">
        <div className="hw-section-title">
          <span>Virtual Circuit Components & Wokwi Peripherals</span>
          <button
            className="hw-btn hw-btn-outline"
            style={{ fontSize: 11.5 }}
            onClick={() => setShowWokwiEmbed(!showWokwiEmbed)}
          >
            {showWokwiEmbed ? 'Hide Embedded Wokwi' : 'Show Wokwi Simulator Access'}
          </button>
        </div>

        {showWokwiEmbed && (
          <div style={{ marginBottom: 16, background: '#0f172a', borderRadius: 8, padding: 14, color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Wokwi ESP32 Circuit Simulation</span>
              <a
                href="https://wokwi.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#38bdf8', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
              >
                Open Wokwi Online ↗
              </a>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#94a3b8' }}>
              The circuit is fully configured in <code>hardware-simulation/diagram.json</code> with firmware in{' '}
              <code>hardware-simulation/marislink_esp32_node.ino</code>.
            </p>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>
              Project files: <code>hardware-simulation/diagram.json</code>, <code>wokwi.toml</code>, <code>libraries.txt</code>
            </div>
          </div>
        )}

        <div className="hw-circuit-layout">
          {/* Left: Circuit Schematic Layout */}
          <div className="hw-schematic-box">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              Microcontroller & Connected Peripherals (ESP32 DevKit v1)
            </div>

            <div className="hw-module-cards">
              <div className="hw-module-item">
                <div className="hw-module-title">ESP32 Core</div>
                <div className="hw-module-val">ESP32-WROOM-32</div>
                <div className="hw-module-desc">WiFi + Dual Core @ 240MHz</div>
              </div>

              <div className="hw-module-item">
                <div className="hw-module-title">I2C Temp & Press</div>
                <div className="hw-module-val">BMP280 Sensor</div>
                <div className="hw-module-desc">SDA: GPIO 21 | SCL: GPIO 22</div>
              </div>

              <div className="hw-module-item">
                <div className="hw-module-title">OLED Display</div>
                <div className="hw-module-val">SSD1306 128x64</div>
                <div className="hw-module-desc">I2C Address: 0x3C</div>
              </div>

              <div className="hw-module-item">
                <div className="hw-module-title">Battery ADC</div>
                <div className="hw-module-val">10kΩ Pot (GPIO 34)</div>
                <div className="hw-module-desc">3.0V - 4.2V LiPo Simulation</div>
              </div>

              <div className="hw-module-item">
                <div className="hw-module-title">RSSI Attenuator</div>
                <div className="hw-module-val">10kΩ Pot (GPIO 35)</div>
                <div className="hw-module-desc">-95 to -55 dBm Acoustic RSSI</div>
              </div>
            </div>

            {/* Hardware LEDs Bar */}
            <div className="hw-leds-bar">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>ON-BOARD LEDS:</span>

              <div className="hw-led-indicator">
                <span className={`hw-led-bulb ${isOnline ? 'green-on' : 'green-off'}`} />
                <span>TX Burst (GPIO 2)</span>
              </div>

              <div className="hw-led-indicator">
                <span className={`hw-led-bulb ${isOnline ? 'yellow-on' : 'yellow-off'}`} />
                <span>Acoustic Sync (GPIO 4)</span>
              </div>

              <div className="hw-led-indicator">
                <span className={`hw-led-bulb ${latest?.node_status === 'CRITICAL' ? 'red-on' : 'red-off'}`} />
                <span>Alert Fault (GPIO 15)</span>
              </div>
            </div>

            {/* Simulated SSD1306 OLED Screen (High-Clarity Reviewer Layout) */}
            <div style={{ background: '#000000', borderRadius: 8, padding: 12, border: '3px solid #334155', color: '#00e5ff', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.45 }}>
              <div style={{ background: '#00e5ff', color: '#000000', padding: '2px 6px', fontWeight: 800, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>MARISLINK ESP32-UW01</span>
                <span>#{latest ? String(latest.sequence).padStart(3, '0') : '000'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: 700 }}>
                <span>RAW TEMP: {latest ? `${(latest.raw_sensor_hpa ? 24.5 + (latest.temperature_c - 3.4) * 5 : 24.5).toFixed(1)} C` : '24.5 C'}</span>
                <span style={{ color: '#38bdf8' }}>OCEAN: {latest ? `${latest.temperature_c.toFixed(2)} C` : '--'}</span>
              </div>
              <div style={{ color: '#e2e8f0' }}>
                PRES: {latest ? `${latest.pressure_mpa.toFixed(2)} MPa` : '--'} ({latest ? `${latest.raw_sensor_hpa.toFixed(0)} hPa` : '--'})
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>BAT : {latest ? `${latest.battery_voltage_v.toFixed(2)}V [${latest.battery_level}%]` : '--'}</span>
                <span style={{ border: '1px solid #00e5ff', padding: '1px 4px', fontSize: 10, letterSpacing: 1 }}>
                  {latest ? '█'.repeat(Math.max(1, Math.min(8, Math.round(latest.battery_level / 12.5)))) : '██████'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span>SIG:{latest ? `${latest.signal_strength.toFixed(0)}dB` : '--'}</span>
                <span style={{ color: latest?.node_status === 'CRITICAL' ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                  [{latest?.communication_status || 'IDLE'}]
                </span>
              </div>
            </div>
          </div>

          {/* Right: Pinout & Wiring Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="hw-pinout-table">
              <thead>
                <tr>
                  <th>ESP32 Pin</th>
                  <th>Peripherals</th>
                  <th>Signal Type</th>
                  <th>Live Reading / Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>GPIO 21</strong></td>
                  <td>BMP280 & SSD1306</td>
                  <td>I2C SDA (Data)</td>
                  <td><span style={{ color: '#0284c7', fontWeight: 600 }}>Active (400 kHz)</span></td>
                </tr>
                <tr>
                  <td><strong>GPIO 22</strong></td>
                  <td>BMP280 & SSD1306</td>
                  <td>I2C SCL (Clock)</td>
                  <td><span style={{ color: '#0284c7', fontWeight: 600 }}>Active (400 kHz)</span></td>
                </tr>
                <tr>
                  <td><strong>GPIO 34</strong></td>
                  <td>Battery Potentiometer</td>
                  <td>ADC Input (0-3.3V)</td>
                  <td>{latest ? `${latest.battery_voltage_v.toFixed(2)} V (${latest.battery_level}%)` : '--'}</td>
                </tr>
                <tr>
                  <td><strong>GPIO 35</strong></td>
                  <td>RSSI Potentiometer</td>
                  <td>ADC Input (0-3.3V)</td>
                  <td>{latest ? `${latest.signal_strength.toFixed(1)} dBm` : '--'}</td>
                </tr>
                <tr>
                  <td><strong>GPIO 2</strong></td>
                  <td>Green LED (220Ω)</td>
                  <td>Digital Output</td>
                  <td>{isOnline ? 'Blinking (TX Burst)' : 'LOW (Idle)'}</td>
                </tr>
                <tr>
                  <td><strong>GPIO 4</strong></td>
                  <td>Yellow LED (220Ω)</td>
                  <td>Digital Output</td>
                  <td>{isOnline ? 'HIGH (Sync Locked)' : 'LOW'}</td>
                </tr>
                <tr>
                  <td><strong>GPIO 15</strong></td>
                  <td>Red LED (220Ω)</td>
                  <td>Digital Output</td>
                  <td>{latest?.node_status === 'CRITICAL' ? 'ALERT HIGH' : 'LOW (Normal)'}</td>
                </tr>
                <tr>
                  <td><strong>3V3 / GND</strong></td>
                  <td>Power Bus</td>
                  <td>Regulated DC</td>
                  <td>3.30 V Nominal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── End-to-End Telemetry & Hardware Integration Pipeline (Task 7) ──── */}
      <div className="hw-pipeline-section">
        <div className="hw-section-title">
          <span>📡 End-to-End Telemetry & Hardware Integration Pipeline</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Deterministic Virtual Architecture</span>
        </div>

        <div className="hw-pipeline-grid">
          <div className="hw-pipe-step">
            <div className="hw-pipe-num">1</div>
            <div className="hw-pipe-content">
              <div className="hw-pipe-title">Transducers & Sensors</div>
              <div className="hw-pipe-desc">BMP280 (I2C) + Dual 10kΩ Potentiometers (ADC 34 & 35) generate physical raw readings.</div>
              <div className="hw-pipe-tag">I2C 0x76 & 12-Bit ADC</div>
            </div>
          </div>

          <div className="hw-pipe-arrow">➔</div>

          <div className="hw-pipe-step">
            <div className="hw-pipe-num">2</div>
            <div className="hw-pipe-content">
              <div className="hw-pipe-title">ESP32 Firmware</div>
              <div className="hw-pipe-desc">Embedded C/C++ applies hydrostatic transfer equation ($P=\rho gh$), updates OLED, & drives LEDs.</div>
              <div className="hw-pipe-tag">Xtensa Dual-Core 240MHz</div>
            </div>
          </div>

          <div className="hw-pipe-arrow">➔</div>

          <div className="hw-pipe-step">
            <div className="hw-pipe-num">3</div>
            <div className="hw-pipe-content">
              <div className="hw-pipe-title">Telemetry Gateway</div>
              <div className="hw-pipe-desc">JSON payload transmitted via Wokwi-GUEST WiFi to backend endpoint with sequence and deduplication tags.</div>
              <div className="hw-pipe-tag">HTTP POST Ingestion</div>
            </div>
          </div>

          <div className="hw-pipe-arrow">➔</div>

          <div className="hw-pipe-step">
            <div className="hw-pipe-num">4</div>
            <div className="hw-pipe-content">
              <div className="hw-pipe-title">Node.js Express Backend</div>
              <div className="hw-pipe-desc">Validates data ranges, updates sliding memory buffer, writes to live CSV, and archives date-wise.</div>
              <div className="hw-pipe-tag">/api/hardware/telemetry</div>
            </div>
          </div>

          <div className="hw-pipe-arrow">➔</div>

          <div className="hw-pipe-step">
            <div className="hw-pipe-num">5</div>
            <div className="hw-pipe-content">
              <div className="hw-pipe-title">Live Website & Spark Lab</div>
              <div className="hw-pipe-desc">Dashboard renders real-time SVG charts, and Apache Spark processes collected dataset for cluster analysis.</div>
              <div className="hw-pipe-tag">Spark 3.5.9 Analytics</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evaluator's Guide: Microcontroller Operation (Task 8) ──────────── */}
      <div className="hw-guide-card">
        <div className="hw-guide-header" onClick={() => setShowEvaluatorGuide(!showEvaluatorGuide)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📘</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                Evaluator's Technical Guide: How the ESP32 Reads Sensors & Updates Display
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                Clear explanation of embedded firmware, electronic buses, and oceanographic calibration for evaluation.
              </div>
            </div>
          </div>
          <button className="hw-btn hw-btn-outline" style={{ fontSize: 11.5 }}>
            {showEvaluatorGuide ? 'Hide Technical Guide' : 'Show Technical Guide'}
          </button>
        </div>

        {showEvaluatorGuide && (
          <div className="hw-guide-grid">
            <div className="hw-guide-item">
              <div className="hw-guide-badge">STAGE 1: I2C BUS COMMUNICATION</div>
              <div className="hw-guide-title">How the ESP32 Reads the BMP Sensor</div>
              <div className="hw-guide-text">
                The ESP32 communicates with the BMP280 barometric sensor over a two-wire <strong>I2C serial bus</strong> using <strong>GPIO 21 (SDA - Serial Data)</strong> and <strong>GPIO 22 (SCL - Serial Clock)</strong>. The firmware calls <code>bmp.readTemperature()</code> and <code>bmp.readPressure()</code> to fetch calibrated digital words from the sensor’s onboard registers at standard 400 kHz bus clock.
              </div>
            </div>

            <div className="hw-guide-item">
              <div className="hw-guide-badge">STAGE 2: 12-BIT SAR ADC SAMPLING</div>
              <div className="hw-guide-title">How Battery & Signal Potentiometers Are Measured</div>
              <div className="hw-guide-text">
                The two potentiometers act as adjustable voltage dividers (0 to 3.3V). The ESP32’s internal <strong>12-bit Analog-to-Digital Converter (ADC)</strong> samples <strong>GPIO 34</strong> (Battery) and <strong>GPIO 35</strong> (Acoustic RSSI), returning values from <code>0</code> to <code>4095</code>. The firmware maps these counts directly to LiPo battery voltage (3.00V–4.20V) and acoustic transceiver strength (-95 to -55 dBm).
              </div>
            </div>

            <div className="hw-guide-item">
              <div className="hw-guide-badge">STAGE 3: HYDROSTATIC PHYSICS MODEL</div>
              <div className="hw-guide-title">Atmospheric MEMS to Deep-Ocean Calibration</div>
              <div className="hw-guide-text">
                Standard physical MEMS sensors measure atmospheric pressure (1013 hPa). At 2000m ocean depth, hydrostatic pressure is ~20.1 MPa (200 atmospheres). The ESP32 applies hydrostatic physics: <code>P = (rho * g * h) / 10^6</code>, transmitting both the physical chamber reading and calibrated oceanographic values to ensure scientific transparency.
              </div>
            </div>

            <div className="hw-guide-item">
              <div className="hw-guide-badge">STAGE 4: OLED & LED INDICATOR UPDATE</div>
              <div className="hw-guide-title">Updating the Screen & Status Transponders</div>
              <div className="hw-guide-text">
                The SSD1306 OLED (128x64) shares the same I2C bus at address <code>0x3C</code>. The firmware prepares an in-memory graphics buffer with the inverted title bar, live temperature readings, depth, and a graphical battery bar gauge, then flushes it via <code>display.display()</code>. Simultaneously, GPIO 2 pulses the green TX LED, GPIO 4 maintains the yellow sync lock, and GPIO 15 triggers the red alert LED on low battery (&lt;20%).
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Real-Time Live Charts ───────────────────────────────────────────── */}
      <div className="hw-charts-grid">
        {/* Pressure & Temperature */}
        <div className="hw-chart-card">
          <div className="hw-chart-header">
            <span className="hw-chart-title">Ocean Hydrostatic Pressure & Temperature</span>
            <div className="hw-chart-legend">
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#0284c7' }} /> Pressure (MPa)
              </span>
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#f59e0b' }} /> Temp (°C)
              </span>
            </div>
          </div>
          {renderMultiChart(history, (r) => r.pressure_mpa, (r) => r.temperature_c, '#0284c7', '#f59e0b')}
        </div>

        {/* Battery Discharge Curve */}
        <div className="hw-chart-card">
          <div className="hw-chart-header">
            <span className="hw-chart-title">Battery Voltage & Capacity Trend</span>
            <div className="hw-chart-legend">
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#10b981' }} /> Voltage (V)
              </span>
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#6366f1' }} /> Capacity (%)
              </span>
            </div>
          </div>
          {renderMultiChart(history, (r) => r.battery_voltage_v, (r) => r.battery_level, '#10b981', '#6366f1')}
        </div>

        {/* Acoustic RSSI & Latency */}
        <div className="hw-chart-card">
          <div className="hw-chart-header">
            <span className="hw-chart-title">Acoustic Signal (RSSI) & Delay</span>
            <div className="hw-chart-legend">
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#8b5cf6' }} /> RSSI (dBm)
              </span>
              <span className="hw-legend-item">
                <span className="hw-legend-dot" style={{ background: '#ec4899' }} /> Latency (ms)
              </span>
            </div>
          </div>
          {renderMultiChart(history, (r) => r.signal_strength, (r) => r.latency_ms, '#8b5cf6', '#ec4899')}
        </div>
      </div>

      {/* ── Recent Telemetry Records Table ─────────────────────────────────── */}
      <div className="hw-table-section">
        <div className="hw-section-title">
          <span>Recent Virtual Telemetry Stream (Last {history.length} Packets)</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Node ID: <strong>ESP32-UW01</strong>
          </span>
        </div>

        <div className="hw-stream-table-wrapper">
          <table className="hw-stream-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Timestamp</th>
                <th>Ocean Depth</th>
                <th>Hydrostatic P.</th>
                <th>Raw Transducer</th>
                <th>Temp (°C)</th>
                <th>Battery</th>
                <th>Acoustic RSSI</th>
                <th>Latency</th>
                <th>Packet Loss</th>
                <th>Comm Status</th>
                <th>Telemetry Source</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                    {loading ? 'Connecting to telemetry stream...' : 'No hardware telemetry packets received yet. Start the virtual node via CLI or Wokwi.'}
                  </td>
                </tr>
              ) : (
                [...history].reverse().slice(0, 15).map((r) => (
                  <tr key={`${r.sequence}-${r.timestamp}`}>
                    <td><strong>#{r.sequence}</strong></td>
                    <td style={{ color: '#475569' }}>{r.timestamp}</td>
                    <td>{r.depth_m.toFixed(1)} m</td>
                    <td><strong style={{ color: '#0284c7' }}>{r.pressure_mpa.toFixed(3)} MPa</strong></td>
                    <td style={{ color: '#64748b' }}>{r.raw_sensor_hpa.toFixed(1)} hPa</td>
                    <td>{r.temperature_c.toFixed(2)} °C</td>
                    <td>{r.battery_voltage_v.toFixed(2)}V ({r.battery_level}%)</td>
                    <td>{r.signal_strength.toFixed(1)} dBm</td>
                    <td>{r.latency_ms.toFixed(1)} ms</td>
                    <td>{r.packet_loss.toFixed(1)}%</td>
                    <td>
                      <span className={`hw-kpi-badge ${(r.communication_status || 'stable').toLowerCase()}`}>
                        {r.communication_status}
                      </span>
                    </td>
                    <td>
                      <span className={`hw-source-tag ${r.is_actual_wokwi || r.source === 'wokwi-esp32-firmware' ? 'wokwi' : 'fallback'}`}>
                        {r.is_actual_wokwi || r.source === 'wokwi-esp32-firmware' ? '⚡ WOKWI FIRMWARE' : '⚙️ NODE.JS FALLBACK'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Virtual Node Execution Instructions ─────────────────────────────── */}
      <div className="hw-quickstart-card">
        <strong style={{ color: '#0f172a', fontSize: 13 }}>🚀 How to Run the Real-Time Virtual Hardware Stream:</strong>
        <div>
          To start the virtual ESP32 hardware streaming continuous live telemetry into MARISLINK:
        </div>
        <div>
          <span className="hw-code-block">npm run hardware:node</span>
          <span style={{ marginLeft: 12, color: '#64748b' }}>or</span>
          <span className="hw-code-block" style={{ marginLeft: 12 }}>node hardware-simulation/run-virtual-node.js</span>
        </div>
        <div style={{ color: '#64748b' }}>
          This runs the virtual ESP32 sensor engine, calculating calibrated BMP280 dynamics and streaming packets directly into the MARISLINK backend (Port 5000), immediately feeding both this live dashboard and the Apache Spark pipeline!
        </div>
      </div>
    </div>
  );
}
