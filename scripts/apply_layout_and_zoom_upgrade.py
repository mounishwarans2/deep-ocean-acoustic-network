#!/usr/bin/env python3
"""
apply_layout_and_zoom_upgrade.py
Implements:
1. Removal of SystemWorkflowBanner from SVG.
2. Creation of SystemWorkflowSection as normal HTML flow below the circuit workspace.
3. Page layout order:
   1. Title & mode selector (.circuit-top-bar)
   2. Evaluator Technical Accuracy Notice (.circuit-academic-notice)
   3. Circuit workspace (.circuit-workspace-body with canvas & inspector sidebar)
   4. Circuit controls and legend (.circuit-canvas-toolbar)
   5. COMPLETE END-TO-END section (SystemWorkflowSection)
   6. Additional Information (CircuitAdditionalInfo)
4. Full Zoom upgrade:
   - Range: 25% to 400% (0.25 to 4.0)
   - Default: 100% (1.0)
   - Zoom in (+), Zoom out (-), Reset (100%), Fit Entire Circuit
   - Zoom indicator display
   - Smooth mouse-wheel zoom towards cursor position
   - Pan drag from empty canvas space
"""

import re, json

with open('src/pages/CircuitConnectionsPage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace old SVG SystemWorkflowBanner with HTML SystemWorkflowSection & CircuitAdditionalInfo
old_workflow_banner_idx = code.find('// ── 5. COMPLETE END-TO-END SYSTEM WORKFLOW BANNER')
comp_page_idx = code.find('// ── MAIN CIRCUIT CONNECTIONS WORKSPACE')

new_workflow_sections = '''// ── 5. COMPLETE END-TO-END SYSTEM WORKFLOW SECTION (HTML FLOW BELOW CANVAS) ──

function SystemWorkflowSection({ mode }: { mode: CircuitMode }) {
  const steps = [
    { num: '1', title: 'Sensors', desc: 'Keller 60MPa, RTD, IMU, Leak', icon: '🌊', color: '#0284c7' },
    { num: '2', title: 'STM32H7 Core', desc: 'Deterministic Data Acquisition', icon: '⚡', color: '#0d9488' },
    { num: '3', title: 'SNC Router', desc: 'Swarm Mesh & TDMA Sched.', icon: '🧠', color: '#4f46e5' },
    { num: '4', title: 'Jetson AI', desc: 'Spectrogram & Anomaly Net', icon: '🤖', color: '#7c3aed' },
    { num: '5', title: 'Acoustic TX', desc: 'DDS DAC ➔ 100W Amp ➔ PZT', icon: '🔊', color: '#db2777' },
    { num: '6', title: 'Subsea Net', desc: 'Multi-Hop Acoustic Relays', icon: '📡', color: '#ea580c' },
    { num: '7', title: 'Storage', desc: 'SLC MicroSD + eMMC/NVMe', icon: '💾', color: '#059669' },
    { num: '8', title: 'Mission UI', desc: 'Spark Big Data & Dashboard', icon: '📊', color: '#d97706' },
  ];

  return (
    <section className="circuit-workflow-section" id="system-workflow-section">
      <div className="workflow-card">
        {/* Header */}
        <div className="workflow-header">
          <div className="workflow-title-wrap">
            <span className="workflow-icon">🔄</span>
            <div>
              <h3 className="workflow-title">COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW</h3>
              <p className="workflow-subtitle">
                Primary Sensor Acquisition ➔ AI Spectrogram Analysis ➔ Acoustic Physical Layer Transmission ➔ Subsea Swarm Mesh Relays
              </p>
            </div>
          </div>
          <div className="workflow-mode-tag">
            Current Architecture Mode: <strong>
              {mode === 'complete_underwater' ? 'Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)' :
               mode === 'esp32_wokwi' ? 'ESP32 Wokwi Production Prototype (32-Bit LX6 + BMP280)' :
               'Arduino Uno Tinkercad Model (Classroom Equivalent)'}
            </strong>
          </div>
        </div>

        {/* 8 Pipeline Step Cards Grid */}
        <div className="workflow-steps-container">
          <div className="workflow-steps-grid">
            {steps.map((st, i) => (
              <React.Fragment key={st.num}>
                <div className="workflow-step-card">
                  <div className="step-header">
                    <span className="step-num-pill" style={{ background: st.color }}>{st.num}</span>
                    <span className="step-title-icon">{st.icon}</span>
                  </div>
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="workflow-step-arrow">➔</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dual Receive Acoustic Path Banner */}
        <div className="workflow-rx-banner">
          <div className="rx-badge">👂 ACOUSTIC RECEIVING PATH</div>
          <div className="rx-text">
            <strong>Subsea Hydrophone (TC4013)</strong> ➔ Ultra-Low Noise LNA (&lt;1.2nV/√Hz) ➔ <strong>24-Bit 192kSPS ADC (ADS1282)</strong> ➔ <strong>STM32H7 Demodulation</strong> ➔ <strong>NVIDIA Jetson / AMD Versal AI Inference</strong> ➔ <strong>SNC Adaptive Mesh Route</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function CircuitAdditionalInfo() {
  return (
    <section className="circuit-additional-info">
      <div className="info-cards-grid">
        <div className="info-card">
          <h4><span>🔊</span> Subsea Acoustic Transceiver</h4>
          <p>
            Transmits modulated acoustic carrier waves between 10 kHz – 200 kHz via custom PZT transducers. Features 100W Class-D resonant amplifier driven by 24-bit AD5791 DAC with microvolt differential receiver front-end.
          </p>
        </div>
        <div className="info-card">
          <h4><span>⚡</span> Heterogeneous Compute Fabric</h4>
          <p>
            Dual-core STM32H747XI (Cortex-M7 @ 480 MHz + M4 @ 240 MHz) provides hard real-time deterministic sensor sampling and TDMA routing; AMD Versal™ / Jetson Orin AI Edge executes subsea acoustic spectrogram neural nets.
          </p>
        </div>
        <div className="info-card">
          <h4><span>🔋</span> Subsea Dual-Source Power Architecture</h4>
          <p>
            Zero-loss LTC4412 Ideal Diode Multiplexer seamlessly arbitrates between the long-duration Micro Nuclear Battery (conceptual trickle feed) and high-discharge LiPo Backup Buffer with synchronous multi-rail buck regulators.
          </p>
        </div>
        <div className="info-card">
          <h4><span>📊</span> Telemetry & Big Data Pipeline</h4>
          <p>
            Live packets stream through Spark SQL streaming engine to persistent Cassandra subsea repositories. Historical analytics, depth profiles, and alerts update in real-time on mission control dashboards.
          </p>
        </div>
      </div>
    </section>
  );
}
'''

assert old_workflow_banner_idx != -1 and comp_page_idx != -1
code = code[:old_workflow_banner_idx] + new_workflow_sections + "\n" + code[comp_page_idx:]

# 2. Update CircuitConnectionsPage component state, zoom methods, and wheel listener
circuit_page_func_start = code.find('export function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {')
render_wire_start = code.find('const renderWirePath = useCallback((wire: CircuitWire) => {')

new_circuit_state_and_handlers = '''export function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {
  const [mode, setMode] = useState<CircuitMode>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('mode');
      if (p === 'esp32_wokwi' || p === 'arduino_tinkercad' || p === 'complete_underwater') return p;
    }
    return 'complete_underwater';
  });
  const [busFilter, setBusFilter] = useState<BusFilter>('ALL');
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedWire, setSelectedWire] = useState<CircuitWire | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Pan & Zoom Canvas Transform State (25% to 400%, default 100%)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Current active components based on mode
  const currentComponents = useMemo(() => {
    switch (mode) {
      case 'complete_underwater':
        return UNDERWATER_COMPONENTS;
      case 'esp32_wokwi':
        return ESP32_COMPONENTS;
      case 'arduino_tinkercad':
        return ARDUINO_COMPONENTS;
      default:
        return UNDERWATER_COMPONENTS;
    }
  }, [mode]);

  const allWiresForMode = useMemo(() => {
    switch (mode) {
      case 'complete_underwater':
        return UNDERWATER_WIRES;
      case 'esp32_wokwi':
        return ESP32_WIRES;
      case 'arduino_tinkercad':
        return ARDUINO_WIRES;
      default:
        return UNDERWATER_WIRES;
    }
  }, [mode]);

  // Filtered Wires
  const currentWires = useMemo(() => {
    if (busFilter === 'ALL') return allWiresForMode;
    return allWiresForMode.filter((w) => {
      if (busFilter === 'POWER') return w.busType === 'POWER';
      if (busFilter === 'GROUND') return w.busType === 'GROUND';
      if (busFilter === 'I2C') return w.busType === 'I2C';
      if (busFilter === 'SPI') return w.busType === 'SPI';
      if (busFilter === 'UART') return w.busType === 'UART';
      if (busFilter === 'ADC/DAC') return w.busType === 'ADC' || w.busType === 'DAC' || w.busType === 'ADC/DAC';
      if (busFilter === 'GPIO/PWM') return w.busType === 'GPIO' || w.busType === 'PWM' || w.busType === 'GPIO/PWM';
      if (busFilter === 'USB/PCIe') return w.busType === 'USB' || w.busType === 'PCIe' || w.busType === 'USB/PCIe';
      return true;
    });
  }, [allWiresForMode, busFilter]);

  // Map of pin coordinates (absolute canvas coords)
  const pinCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentComponents.forEach((comp) => {
      comp.pins.forEach((pin) => {
        map.set(`${comp.id}:${pin.id}`, {
          x: comp.x + pin.x,
          y: comp.y + pin.y,
        });
      });
    });
    return map;
  }, [currentComponents]);

  // Reset to default 100% zoom
  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 30, y: 30 });
    setSelectedComponent(null);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  // Fit entire circuit into viewport
  const handleFitCircuit = useCallback(() => {
    const canvasElem = canvasRef.current;
    if (!canvasElem || currentComponents.length === 0) return;
    const vpW = canvasElem.clientWidth || 1200;
    const vpH = canvasElem.clientHeight || 680;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    currentComponents.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height + 60);
    });

    const circuitW = maxX - minX + 100;
    const circuitH = maxY - minY + 100;

    const fitScale = Math.max(0.25, Math.min(4.0, Math.min(vpW / circuitW, vpH / circuitH)));
    const roundedZoom = Math.round(fitScale * 100) / 100;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = Math.round(vpW / 2 - centerX * roundedZoom);
    const newPanY = Math.round(vpH / 2 - centerY * roundedZoom);

    setZoom(roundedZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [currentComponents]);

  // Step Zoom (+ / -) towards center of viewport
  const handleZoomStep = useCallback((delta: number) => {
    const canvasElem = canvasRef.current;
    const vpW = canvasElem ? canvasElem.clientWidth : 1200;
    const vpH = canvasElem ? canvasElem.clientHeight : 680;
    const centerX = vpW / 2;
    const centerY = vpH / 2;

    setZoom((prevZoom) => {
      const nextZoom = Math.max(0.25, Math.min(4.0, Math.round((prevZoom + delta) * 100) / 100));
      if (nextZoom === prevZoom) return prevZoom;

      const canvasX = (centerX - pan.x) / prevZoom;
      const canvasY = (centerY - pan.y) / prevZoom;
      setPan({
        x: Math.round(centerX - canvasX * nextZoom),
        y: Math.round(centerY - canvasY * nextZoom),
      });
      return nextZoom;
    });
  }, [pan]);

  // Smooth mouse-wheel zoom towards cursor position
  const handleWheelZoom = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasElem = canvasRef.current;
    if (!canvasElem) return;

    const rect = canvasElem.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    let nextZoom = Math.round(zoom * factor * 100) / 100;
    nextZoom = Math.max(0.25, Math.min(4.0, nextZoom));

    if (nextZoom === zoom) return;

    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;
    const newPanX = Math.round(mouseX - canvasX * nextZoom);
    const newPanY = Math.round(mouseY - canvasY * nextZoom);

    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);

  // Attach non-passive wheel listener to circuit viewport
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelZoom);
    };
  }, [handleWheelZoom]);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | SVGElement;
    if (
      target.closest('.circuit-comp-group') ||
      target.closest('.circuit-wire-group') ||
      target.closest('.circuit-pin-point') ||
      target.closest('button')
    ) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleSelectComponent = (comp: CircuitComponent) => {
    setSelectedComponent(comp);
    setSelectedWire(null);
    setHighlightedPin(null);
  };

  const handleSelectWire = (wire: CircuitWire) => {
    setSelectedWire(wire);
    setSelectedComponent(null);
    setHighlightedPin({ compId: wire.sourceComponentId, pinId: wire.sourcePinId });
  };

  const handleSelectPin = (comp: CircuitComponent, pin: PinDefinition) => {
    setSelectedComponent(comp);
    setHighlightedPin({ compId: comp.id, pinId: pin.id });
    const connected = currentWires.find(
      (w) => (w.sourceComponentId === comp.id && w.sourcePinId === pin.id) ||
             (w.destComponentId === comp.id && w.destPinId === pin.id)
    );
    if (connected) {
      setSelectedWire(connected);
    }
  };
'''

assert circuit_page_func_start != -1 and render_wire_start != -1
code = code[:circuit_page_func_start] + new_circuit_state_and_handlers + "\n\n  " + code[render_wire_start:]

# 3. Update return JSX to match the required order:
# 1. Page title and mode selector
# 2. Circuit workspace and components (with inspector sidebar)
# 3. Circuit controls and legend
# 4. COMPLETE END-TO-END section
# 5. Additional information
jsx_start = code.find('return (\n    <div className="circuit-workspace-container">')
assert jsx_start != -1

new_jsx = '''return (
    <div className="circuit-workspace-container">
      {/* ── 1. Page Title & Mode Selector ─────────────────────────────────── */}
      <div className="circuit-top-bar">
        <div className="circuit-title-area">
          <h2>
            <span>🔌</span> MARISLINK – CIRCUIT CONNECTIONS
          </h2>
          <p>
            Interactive 2D Electronics Schematic & Pin-to-Pin System Architecture (Tinkercad & Wokwi Engineering Workspace)
          </p>
        </div>

        {/* Three Architecture Mode Switcher */}
        <div className="circuit-mode-toggle">
          <button
            className={`mode-btn mode-complete ${mode === 'complete_underwater' ? 'active' : ''}`}
            onClick={() => {
              setMode('complete_underwater');
              handleResetView();
            }}
          >
            🌊 Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)
          </button>
          <button
            className={`mode-btn mode-esp32 ${mode === 'esp32_wokwi' ? 'active' : ''}`}
            onClick={() => {
              setMode('esp32_wokwi');
              handleResetView();
            }}
          >
            ⚡ ESP32 Wokwi Production Prototype (32-Bit LX6 + BMP280)
          </button>
          <button
            className={`mode-btn mode-arduino ${mode === 'arduino_tinkercad' ? 'active' : ''}`}
            onClick={() => {
              setMode('arduino_tinkercad');
              handleResetView();
            }}
          >
            📘 Arduino Uno Tinkercad Model (Classroom Equivalent)
          </button>
        </div>
      </div>

      {/* ── Academic Technical Accuracy Notice ─────────────────────────────── */}
      <div className="circuit-academic-notice">
        <span className="notice-badge implemented">IMPLEMENTED</span>
        <strong>Verified Embedded Prototype:</strong> Mode A runs the compiled ESP32 firmware on simulated Wokwi hardware with live telemetry ingestion.
        <span className="notice-badge architectural" style={{ marginLeft: 14 }}>ARCHITECTURAL</span>
        <strong>Deep-Sea Production Design:</strong> Mode B models the full multi-rail power system, AMD Versal™ / NVIDIA AI, STM32H7 SNC controller, and hydrophone transceiver.
        <span className="notice-badge simulated" style={{ marginLeft: 14 }}>SIMULATED</span>
        <strong>Classroom Equivalent:</strong> Mode C models the Tinkercad tutorial Arduino Uno circuit using supported 8-bit AVR components.
      </div>

      {/* ── 2. Circuit Workspace & Components (Canvas + Inspector Sidebar) ── */}
      <div className="circuit-workspace-body">
        {/* Interactive SVG Canvas Viewport */}
        <div
          ref={viewportRef}
          className={`circuit-canvas-viewport ${isPanning ? 'panning' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Floating On-Canvas Quick Zoom Controls (25% - 400%) */}
          <div className="circuit-canvas-floating-controls">
            <button className="float-ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
            <button className="float-ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (-25%)">－</button>
            <span className="float-zoom-badge" title="Current Zoom Level">{Math.round(zoom * 100)}%</span>
            <button className="float-ctrl-btn btn-text" onClick={handleResetView} title="Reset Zoom to 100%">100%</button>
            <button className="float-ctrl-btn btn-text" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">📐 Fit</button>
          </div>

          <svg
            ref={canvasRef}
            className="circuit-svg-canvas"
            width="100%"
            height="100%"
            viewBox={
              mode === 'complete_underwater' ? '0 0 2160 920' :
              mode === 'esp32_wokwi' ? '0 0 1000 680' :
              '0 0 1100 520'
            }
          >
            <defs>
              <pattern id="tinkercad-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <rect width="24" height="24" fill="#f8fafc" />
                <circle cx="12" cy="12" r="1.2" fill="#cbd5e1" />
              </pattern>
            </defs>

            {/* Background Grid Layer */}
            <rect
              id="grid-background"
              x="-4000"
              y="-4000"
              width="10000"
              height="10000"
              fill="url(#tinkercad-grid)"
            />

            {/* Subsystem Bounding Groups (Mode B Only) */}
            {mode === 'complete_underwater' && (
              <g className="groups-layer" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {UNDERWATER_GROUPS.map((g) => (
                  <g key={g.id}>
                    <rect
                      x={g.x}
                      y={g.y}
                      width={g.width}
                      height={g.height}
                      rx={10}
                      fill={g.color}
                      stroke={g.accent}
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      opacity={0.8}
                    />
                    <text
                      x={g.x + 16}
                      y={g.y + 24}
                      fill={g.accent}
                      fontSize={11.5}
                      fontWeight="800"
                      letterSpacing={0.8}
                      fontFamily="system-ui, sans-serif"
                    >
                      {g.name}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Canvas Transformation Group (Zoom & Pan) */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* 1. Connecting Wires Layer */}
              <g className="wires-layer">
                {currentWires.map(renderWirePath)}
              </g>

              {/* 2. Electronic Components Layer */}
              <g className="components-layer">
                {currentComponents.map((comp) => (
                  <ComponentShape
                    key={comp.id}
                    comp={comp}
                    isSelected={selectedComponent?.id === comp.id}
                    highlightedPinId={highlightedPin ? `${highlightedPin.compId}:${highlightedPin.pinId}` : null}
                    onSelectComponent={handleSelectComponent}
                    onSelectPin={handleSelectPin}
                  />
                ))}
              </g>
            </g>
          </svg>

          {/* Quick Help Watermark */}
          <div className="circuit-canvas-hint">
            <span>🖱️ Click any component or wire to inspect • Click & drag canvas to pan • Scroll wheel to zoom (25% - 400%)</span>
          </div>
        </div>

        {/* ── Component / Wire Inspector Sidebar ────────────────────────────── */}
        <div className="circuit-inspector-sidebar">
          {selectedWire ? (
            /* Wire Inspector */
            <div className="inspector-content">
              <div className="inspector-header-badges">
                <div className="inspector-badge wire-badge">
                  <span className="dot" style={{ background: selectedWire.color }} />
                  <span>WIRE CONNECTION INSPECTOR</span>
                </div>
              </div>
              <h3 className="inspector-title">{selectedWire.name}</h3>

              <div className="inspector-kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Signal Bus</span>
                  <span className="kv-val bus-val">{selectedWire.busType}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Voltage / Logic</span>
                  <span className="kv-val">{selectedWire.voltage}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Wire Insulation</span>
                  <span className="kv-val">{selectedWire.colorName}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Direction</span>
                  <span className="kv-val">{selectedWire.signalDirection || 'BIDIRECTIONAL'}</span>
                </div>
              </div>

              <div className="pin-to-pin-box">
                <div className="p2p-header">PIN-TO-PIN CONNECTION ROUTE:</div>
                <div className="p2p-route">
                  <div className="p2p-node">
                    <span className="comp-name">{selectedWire.sourceComponentId.toUpperCase()}</span>
                    <span className="pin-label">Pin: <strong>{selectedWire.sourcePinId.toUpperCase()}</strong></span>
                  </div>
                  <div className="p2p-arrow" style={{ color: selectedWire.color }}>➔</div>
                  <div className="p2p-node">
                    <span className="comp-name">{selectedWire.destComponentId.toUpperCase()}</span>
                    <span className="pin-label">Pin: <strong>{selectedWire.destPinId.toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>

              {selectedWire.connectionPurpose && (
                <div className="inspector-desc-section">
                  <div className="section-label">Connection Purpose:</div>
                  <p>{selectedWire.connectionPurpose}</p>
                </div>
              )}

              {selectedWire.signalDescription && (
                <div className="inspector-desc-section">
                  <div className="section-label">Signal Description & Role:</div>
                  <p>{selectedWire.signalDescription}</p>
                </div>
              )}

              <button className="hw-btn hw-btn-outline" onClick={() => setSelectedWire(null)}>
                Clear Wire Selection
              </button>
            </div>
          ) : selectedComponent ? (
            /* Component Inspector */
            <div className="inspector-content">
              <div className="inspector-header-badges">
                <div className="inspector-badge comp-badge">
                  <span>COMPONENT PROPERTY INSPECTOR</span>
                </div>
                <span className={`status-tag ${(selectedComponent.status || 'IMPLEMENTED').toLowerCase()}`}>
                  {selectedComponent.status || 'IMPLEMENTED'}
                </span>
              </div>
              <h3 className="inspector-title">{selectedComponent.name}</h3>
              <div className="inspector-part-num">Part: <code>{selectedComponent.modelNumber}</code></div>

              <div className="inspector-kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Category</span>
                  <span className="kv-val">{selectedComponent.category}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Protocol</span>
                  <span className="kv-val">{selectedComponent.protocol}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Operating V</span>
                  <span className="kv-val">{selectedComponent.operatingVoltage}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Current Draw</span>
                  <span className="kv-val">{selectedComponent.currentDraw}</span>
                </div>
              </div>

              <div className="inspector-desc-section">
                <div className="section-label">Role in MARISLINK Underwater Node:</div>
                <p>{selectedComponent.roleInMarislink}</p>
              </div>

              {selectedComponent.technicalExplanation && (
                <div className="inspector-tech-box">
                  <strong>Technical Engineering Details:</strong> {selectedComponent.technicalExplanation}
                </div>
              )}

              {selectedComponent.tinkercadEquivNote && (
                <div className="inspector-compat-box">
                  <strong>Classroom Equivalence Note:</strong> {selectedComponent.tinkercadEquivNote}
                </div>
              )}

              {selectedComponent.connectedDevices && selectedComponent.connectedDevices.length > 0 && (
                <div className="inspector-desc-section">
                  <div className="section-label">Directly Connected Devices:</div>
                  <div className="inspector-connected-tags">
                    {selectedComponent.connectedDevices.map((dev) => (
                      <span key={dev} className="connected-tag">{dev}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pin Mapping Table */}
              <div className="inspector-pins-table-section">
                <div className="section-label">
                  Pins & Connected Circuits ({selectedComponent.pins.length} Pins, {connectedWiresToSelected.length} Active Wires):
                </div>
                <div className="table-wrapper">
                  <table className="inspector-pin-table">
                    <thead>
                      <tr>
                        <th>Pin</th>
                        <th>Type</th>
                        <th>Connected Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedComponent.pins.map((pin) => {
                        const connected = currentWires.find(
                          (w) => (w.sourceComponentId === selectedComponent.id && w.sourcePinId === pin.id) ||
                                 (w.destComponentId === selectedComponent.id && w.destPinId === pin.id)
                        );
                        return (
                          <tr
                            key={pin.id}
                            className={highlightedPin?.pinId === pin.id ? 'row-highlighted' : ''}
                            onClick={() => handleSelectPin(selectedComponent, pin)}
                          >
                            <td><strong>{pin.label}</strong></td>
                            <td><span className={`pin-type-tag ${pin.type.toLowerCase()}`}>{pin.type}</span></td>
                            <td style={{ fontSize: 11 }}>
                              {connected ? (
                                <span style={{ color: connected.color, fontWeight: 700 }}>
                                  ➔ {connected.sourceComponentId === selectedComponent.id ? connected.destComponentId.toUpperCase() : connected.sourceComponentId.toUpperCase()} ({connected.busType})
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Unconnected / Internal</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <button className="hw-btn hw-btn-outline" onClick={() => setSelectedComponent(null)}>
                Deselect Component
              </button>
            </div>
          ) : (
            /* Default Empty State */
            <div className="inspector-empty-state">
              <span style={{ fontSize: 36 }}>🔍</span>
              <h4>Interactive Circuit Inspector</h4>
              <p>
                Click any electronic component on the canvas to inspect its physical pinout, operating voltages, communication protocol, and role in MARISLINK.
              </p>
              <p style={{ marginTop: 10, fontSize: 11.5, color: '#64748b' }}>
                Click any wire to view its source pin, destination pin, signal bus type, and electrical properties.
              </p>

              <div className="empty-state-stats">
                <div className="stat-pill">Components: <strong>{currentComponents.length}</strong></div>
                <div className="stat-pill">Wires: <strong>{currentWires.length}</strong></div>
                <div className="stat-pill">Mode: <strong>{mode === 'complete_underwater' ? 'Complete System' : mode === 'esp32_wokwi' ? 'ESP32' : 'Arduino'}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Circuit Controls & Legend ──────────────────────────────────── */}
      <div className="circuit-canvas-toolbar">
        {/* Bus Filter Pills */}
        <div className="circuit-filter-pills">
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>WIRE BUS FILTER:</span>
          {(['ALL', 'POWER', 'GROUND', 'I2C', 'SPI', 'UART', 'ADC/DAC', 'GPIO/PWM', 'USB/PCIe'] as BusFilter[]).map((f) => (
            <button
              key={f}
              className={`filter-pill ${busFilter === f ? 'active' : ''}`}
              onClick={() => setBusFilter(f)}
            >
              {f === 'POWER' && '🔴 Power (+12V/+5V/+3.3V)'}
              {f === 'GROUND' && '⚫ Ground (GND)'}
              {f === 'I2C' && '🩵 I2C (SDA/SCL)'}
              {f === 'SPI' && '🔵 SPI Bus'}
              {f === 'UART' && '🟣 UART Serial'}
              {f === 'ADC/DAC' && '🟠 ADC/DAC Analog'}
              {f === 'GPIO/PWM' && '🟢 GPIO/PWM'}
              {f === 'USB/PCIe' && '🔵 High-Speed USB/PCIe'}
              {f === 'ALL' && '🌈 All Wires'}
            </button>
          ))}
        </div>

        {/* Zoom & View Controls */}
        <div className="circuit-zoom-controls">
          <button className="ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (-25%)">－</button>
          <span className="zoom-indicator" title="Current Zoom">{Math.round(zoom * 100)}%</span>
          <button className="ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
          <button className="ctrl-btn reset" onClick={handleResetView} title="Reset to 100% Zoom">
            Reset 100%
          </button>
          <button className="ctrl-btn reset fit" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">
            📐 Fit Circuit
          </button>

          {onNavigateToSpark && (
            <button className="spark-nav-btn" onClick={onNavigateToSpark}>
              ⚡ Spark Lab
            </button>
          )}
        </div>
      </div>

      {/* ── 4. COMPLETE END-TO-END SECTION (HTML Flow Below Canvas) ───────── */}
      <SystemWorkflowSection mode={mode} />

      {/* ── 5. Additional System Architecture Specifications ──────────────── */}
      <CircuitAdditionalInfo />
    </div>
  );
}
'''

code = code[:jsx_start] + new_jsx

with open('src/pages/CircuitConnectionsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("[SUCCESS] Upgraded CircuitConnectionsPage.tsx layout and zoom controls!")
