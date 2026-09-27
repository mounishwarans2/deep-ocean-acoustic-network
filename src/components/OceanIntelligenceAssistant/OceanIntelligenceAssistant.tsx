import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { SimulationState } from '../../hooks/useSimulation';
import { buildSnapshot } from '../../services/aiContext';
import type { DashboardSnapshot } from '../../services/aiContext';
import { buildRichResponse, createConversationContext } from '../../services/assistantResponses';
import type { Block } from '../../services/assistantResponses';
import { readNotifyStatus } from '../../utils/notify';
import type { WhaleMood } from './WhaleAvatar';
import { WhaleOrbit } from './WhaleOrbit';
import { ResponseBlock } from './ResponseBlocks';
import './OceanIntelligenceAssistant.css';

export interface FailureSignal {
  key: number;
  nodeId: string;
  reason: string;
}

interface Props {
  state: SimulationState | null;
  failure: FailureSignal | null;
  /** true while the dashboard is in the red emergency state */
  failureActive: boolean;
  /** true while the Explore drawer is open (shift aside) */
  exploreOpen: boolean;
  onOpenPage: (page: string) => void;
  /** display-only: suppress the failure announcement bubble (recovery logic untouched) */
  announcementsEnabled?: boolean;
}

interface FailureCard {
  nodeId: string;
  status: string;
  comms: string;
  time: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  blocks: Block[];
  /** set only when the answer actually used that source — greetings carry none */
  source?: 'live' | 'knowledge' | 'mixed';
  failureCard?: FailureCard;
}

const POS_KEY = 'ocean-intelligence-position';
const CONSOLE_W = 460;
const HEADER_VISIBLE = 50;

interface XY { x: number; y: number; }

function loadPosition(): XY | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<XY>;
    if (typeof p.x !== 'number' || typeof p.y !== 'number' || !isFinite(p.x) || !isFinite(p.y)) return null;
    return { x: p.x, y: p.y };
  } catch {
    return null;
  }
}

/** Keep the window on-screen with at least HEADER_VISIBLE px of header grabbable. */
function clampPos(x: number, y: number, w: number): XY {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(Math.max(x, -(w - HEADER_VISIBLE)), Math.max(vw - HEADER_VISIBLE, 0)),
    y: Math.min(Math.max(y, 0), Math.max(vh - 40, 0)),
  };
}

function defaultPos(): XY {
  return clampPos(window.innerWidth - CONSOLE_W - 30, 120, CONSOLE_W);
}

const SUGGESTIONS = [
  'Show network',
  'Explain SNC',
  'Show depth profile',
  'Explain PRISM',
  'Ocean environment',
  'System status',
];

export function OceanIntelligenceAssistant({ state, failure, failureActive, exploreOpen, onOpenPage, announcementsEnabled = true }: Props) {
  // CLOSED by default: only the small robot launcher is visible.
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [whale, setWhale] = useState<WhaleMood>('idle');
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [unread, setUnread] = useState(0);
  // Draggable window position. null = never placed (falls back to docked CSS).
  const [pos, setPos] = useState<XY | null>(() => loadPosition());
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<XY | null>(null);
  const foundTimer = useRef<number>(0);
  const insertedFailures = useRef<Set<number>>(new Set());
  const idRef = useRef(0);
  const ctxRef = useRef(createConversationContext());
  const nextId = useCallback(() => `m${Date.now().toString(36)}-${(idRef.current += 1)}`, []);

  useEffect(() => () => {
    window.clearTimeout(foundTimer.current);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, thinking]);

  // Failure event: insert ONE emergency assistant message + badge.
  // The chat window itself is NOT auto-opened.
  useEffect(() => {
    if (!failure || insertedFailures.current.has(failure.key)) return;
    insertedFailures.current.add(failure.key);
    const at = new Date().toLocaleTimeString('en-US', { hour12: false });
    const simTime = state ? new Date(state.lastUpdate).toLocaleTimeString('en-US', { hour12: false }) : at;
    setMessages(m => [
      ...m,
      {
        id: `fail-${failure.key}`,
        role: 'assistant',
        text: '🚨 CRITICAL SYSTEM ALERT\n\nSystem failure has been detected in the underwater communication network.\n\nI can help you inspect the affected node, network condition, energy status and communication metrics.',
        timestamp: Date.now(),
        blocks: [],
        source: 'live',
        failureCard: { nodeId: failure.nodeId, status: 'CRITICAL', comms: 'FAILED', time: simTime },
      },
    ]);
    setUnread(u => u + 1);
    setWhale('failure');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure?.key]);

  // whale leaves failure state once the emergency is acknowledged
  useEffect(() => {
    if (!failureActive) {
      setWhale(prev => (prev === 'failure' || prev === 'warning' ? 'idle' : prev));
    }
  }, [failureActive]);

  const openChat = useCallback(() => {
    // Restore last user position if valid, else use the default top-right spot.
    setPos(prev => {
      const base = prev ?? loadPosition() ?? defaultPos();
      const el = consoleRef.current;
      const next = clampPos(base.x, base.y, el?.offsetWidth || CONSOLE_W);
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(next));
      } catch { /* storage unavailable — position simply won't persist */ }
      return next;
    });
    setChatOpen(true);
    setUnread(0);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
  }, []);

  // ── Dragging: header is the ONLY handle (content stays fully interactive) ──
  const onHeaderPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    if (window.innerWidth <= 640) return; // small screens: fixed overlay, no drag
    const el = consoleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const onHeaderPointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragOffset.current) return;
    const el = consoleRef.current;
    const w = el?.offsetWidth || CONSOLE_W;
    setPos(clampPos(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y, w));
  }, []);

  const endDrag = useCallback(() => {
    if (!dragOffset.current) return;
    dragOffset.current = null;
    setDragging(false);
    // Persist the user's chosen position (read fresh — never auto-reposition).
    setPos(prev => {
      if (prev) {
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(prev));
        } catch { /* ignore */ }
      }
      return prev;
    });
  }, []);

  // Keep a placed window inside the viewport on resize — never move it otherwise.
  useEffect(() => {
    if (!chatOpen) return;
    const onResize = () => {
      const el = consoleRef.current;
      setPos(prev => (prev ? clampPos(prev.x, prev.y, el?.offsetWidth || CONSOLE_W) : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [chatOpen]);

  const flashFound = useCallback(() => {
    setWhale('found');
    window.clearTimeout(foundTimer.current);
    foundTimer.current = window.setTimeout(() => {
      setWhale(prev => (prev === 'found' ? 'idle' : prev));
    }, 2600);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || thinking) return;
      // 1) user message appears immediately, 2) input clears, 3) thinking shows
      setMessages(m => [...m, { id: nextId(), role: 'user', text: q, timestamp: Date.now(), blocks: [] }]);
      setInput('');
      if (!state) {
        setMessages(m => [...m, { id: nextId(), role: 'assistant', text: 'Telemetry is still initialising — please try again in a few seconds.', timestamp: Date.now(), blocks: [] }]);
        return;
      }
      setThinking(true);
      setWhale('thinking');
      // short natural beat so the exchange feels conversational, never instant
      await new Promise(r => setTimeout(r, 450));
      try {
        const snap = buildSnapshot(state);
        setSnapshot(snap);
        const rich = buildRichResponse(q, snap, ctxRef.current);
        setMessages(m => [...m, { id: nextId(), role: 'assistant', text: rich.text, timestamp: Date.now(), blocks: rich.blocks, source: rich.source }]);
        if (failureActive) setWhale('failure');
        else if (rich.mood === 'warning') setWhale('warning');
        else if (rich.mood === 'found') flashFound();
        else setWhale('idle');
      } finally {
        setThinking(false);
      }
    },
    [state, thinking, failureActive, flashFound, nextId],
  );

  const notify = readNotifyStatus();

  // The open console is position:fixed with its own x/y (never shifted).
  // Only the closed launcher slides aside while Explore is open.
  const shifted = exploreOpen && !chatOpen;
  return (
    <div className={`oi-root${shifted ? ' shifted' : ''}`} aria-label="Ocean Intelligence Assistant">
      {/* small floating robot launcher — the only thing visible by default */}
      {!chatOpen && (
        <>
          {failureActive && unread > 0 && announcementsEnabled && (
            <div className="oi-bubble" role="alert">
              <div className="oi-bubble-title">🚨 Ocean Intelligence</div>
              <div className="oi-bubble-text">System failure detected. Check the underwater network.</div>
              <button type="button" className="oi-btn" onClick={openChat}>Open Assistant</button>
            </div>
          )}
          <button
            type="button"
            className={`oi-launcher${failureActive ? ' alert' : ''}`}
            onClick={openChat}
            aria-label={failureActive ? 'Ocean Intelligence — system failure alert, open assistant' : 'Ocean Intelligence — open assistant'}
            title="Ocean Intelligence"
          >
            <WhaleOrbit state={failureActive ? 'alert' : thinking ? 'thinking' : 'normal'} />
            {unread > 0 && (
              <span className="oi-badge" aria-label={`${unread} unread alerts`}>{unread}</span>
            )}
          </button>
        </>
      )}

      {chatOpen && (
        <div
          ref={consoleRef}
          className={`oi-console oi-floating${dragging ? ' oi-dragging' : ''}`}
          role="dialog"
          aria-label="Ocean Intelligence chat"
          style={pos ? { left: pos.x, top: pos.y } : undefined}
        >
          <div
            className="oi-top"
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="oi-brand">
              <span className="oi-brand-mark" aria-hidden="true">🌊</span>
              <div>
                <div className="oi-brand-name">OCEAN INTELLIGENCE</div>
                <div className="oi-brand-sub">Deep Ocean Acoustic Communication</div>
              </div>
            </div>
            <div className="oi-win">
              <button type="button" onClick={closeChat} aria-label="Minimize chat">−</button>
              <button type="button" onClick={closeChat} aria-label="Close chat">×</button>
            </div>
          </div>

          <div className="oi-livebar">
            <span className={`oi-pulse${state ? ' on' : ''}`} aria-hidden="true" />
            <span>● SYSTEM MONITORING ACTIVE</span>
          </div>
          <div className="oi-counts">
            {state ? `${state.devices.length} Nodes • ${state.links.length} Links • Simulation` : 'Connecting telemetry…'}
          </div>

          <div className="oi-whalebox">
            <img
              src="/dolphins.gif"
              alt="Dolphin pod in the monitored ocean zone"
              className="oi-monitor-gif"
              onError={() => console.warn('[Ocean Intelligence] dolphins.gif failed to load from /dolphins.gif')}
            />
            <div className="oi-whalelabel" data-mood={whale}>{whale === 'idle' ? 'MONITORING' : whale === 'thinking' ? 'ANALYZING' : whale === 'found' ? 'DATA FOUND' : whale === 'warning' ? 'ALERT' : 'SYSTEM FAILURE'}</div>
          </div>

          <div className="oi-scroll" ref={bodyRef}>
            {messages.length === 0 && (
              <div className="oi-hint">Ask about live telemetry or ocean concepts. Visual answers appear right here — the dashboard never navigates away.</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`oi-msg ${m.role}`}>
                {m.role === 'assistant' && <span className="oi-msg-whale" aria-hidden="true">🐋</span>}
                <div className="oi-msg-main">
                  {m.role === 'assistant' && m.source && (
                    <div className="oi-src">
                      {m.source === 'live' ? '● LIVE DASHBOARD DATA' : m.source === 'mixed' ? '● LIVE DATA + ANALYSIS' : '○ GENERAL OCEAN KNOWLEDGE'}
                    </div>
                  )}
                  <div className="oi-msg-text">{m.text}</div>
                  {m.failureCard && (
                    <div className="oi-failure-card" role="alert">
                      <div className="rb-kv"><span>Node</span><b>{m.failureCard.nodeId}</b></div>
                      <div className="rb-kv"><span>Status</span><b>{m.failureCard.status}</b></div>
                      <div className="rb-kv"><span>Communication</span><b>{m.failureCard.comms}</b></div>
                      <div className="rb-kv"><span>Time</span><b>{m.failureCard.time}</b></div>
                      <div className="oi-failure-channels">
                        <span>📱 SMS notification {notify ? `— ${notify.sms}` : 'initiated'}</span>
                        <span>☎ Emergency call {notify ? `— ${notify.call}` : 'initiated'}</span>
                      </div>
                    </div>
                  )}
                  {m.role === 'assistant' && snapshot && m.blocks.map((b, j) => (
                    <ResponseBlock key={`${m.id}-${j}`} block={b} snapshot={snapshot} onConfirmNav={onOpenPage} />
                  ))}
                </div>
              </div>
            ))}
            {thinking && <div className="oi-thinking">🐋 Ocean Intelligence is thinking…</div>}
          </div>

          <div className="oi-suggest-row" aria-label="Suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} type="button" className="oi-chip" onClick={() => void ask(s)}>{s}</button>
            ))}
          </div>

          <form
            className="oi-input-row"
            onSubmit={e => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <input
              className="oi-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Ocean Intelligence..."
              aria-label="Ask Ocean Intelligence"
            />
            <button type="submit" className="oi-send" disabled={!input.trim() || thinking} aria-label="Send question">➤</button>
          </form>
        </div>
      )}
    </div>
  );
}
