export interface MenuSection {
  heading?: string;
  paragraph?: string;
  bullets?: string[];
  flow?: string[];
  items?: { num?: string; title: string; desc?: string }[];
  checklist?: { done?: string[]; inProgress?: string[]; future?: string[] };
  note?: string;
  stability?: string[];
  accent?: boolean;
}

export interface MenuOption {
  id: string;
  label: string;
  icon: string;
  actionType: 'content' | 'page' | 'theme' | 'logout';
  page?: string;
  theme?: 'dark' | 'light' | 'system';
  sections?: MenuSection[];
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  options: MenuOption[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'mission',
    label: 'MISSION CONTROL',
    icon: '🚀',
    options: [
      {
        id: 'vision',
        label: 'Vision & Objective',
        icon: '🎯',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'To develop an intelligent, autonomous and reliable underwater acoustic communication network capable of adaptive operation in deep-ocean environments.',
          },
        ],
      },
      {
        id: 'mission-arch',
        label: 'Mission Architecture',
        icon: '🏛️',
        actionType: 'content',
        sections: [
          {
            heading: 'Complete Communication Architecture',
            flow: [
              'UNDERWATER SENSOR',
              'LOCAL DATA STORAGE',
              'AI MONITORING',
              'PRISM ROUTING',
              'SUB-NODE',
              'MAIN NODE',
              'SURFACE RECEIVER',
              'LAND DATA CENTER',
              'BIG DATA ANALYTICS',
            ],
          },
        ],
      },
      {
        id: 'system-mission',
        label: 'System Mission',
        icon: '🛰️',
        actionType: 'content',
        sections: [
          {
            heading: 'Main Objectives',
            items: [
              { num: '01', title: 'UNDERWATER COMMUNICATION', desc: 'Build a reliable multi-node acoustic communication network.' },
              { num: '02', title: 'PROGRAMMING INTELLIGENCE', desc: 'Enable autonomous monitoring and communication decisions.' },
              { num: '03', title: 'PRISM ADAPTIVE ROUTING', desc: 'Select suitable routes and reroute communication when links or nodes fail.' },
              { num: '04', title: 'SNC ANALYTICS', desc: 'Analyze latency, traffic intensity, packet loss, service rate, backlog and stability.' },
              { num: '05', title: 'LONG-DURATION POWER', desc: 'Provide continuous autonomous power with hybrid power architecture.' },
              { num: '06', title: 'DEEP-OCEAN DEPLOYMENT', desc: 'Support operation in high-pressure underwater environments.' },
              { num: '07', title: 'EMERGENCY RECOVERY', desc: 'Provide an emergency failure response and recovery mechanism.' },
            ],
          },
        ],
      },
      {
        id: 'milestones',
        label: 'Completed Milestones',
        icon: '✅',
        actionType: 'content',
        sections: [
          {
            heading: 'Implemented Project Achievements',
            checklist: {
              done: [
                'AI Decision System',
                'PRISM Routing',
                'SNC Analytics',
                'Hybrid Power Architecture',
                'Emergency Recovery Concept',
                'Interactive Ocean Network Map',
                'Big Data Analytics Pipeline',
                'Underwater Device Prototype Design',
              ],
              inProgress: ['3D Device Visualization', 'Advanced Interactive Simulation'],
              future: [
                'Physical hardware prototype',
                'Real underwater acoustic testing',
                'Real sensor integration',
                'Advanced AI training',
                'Large-scale ocean deployment',
                'Enhanced recovery mechanisms',
              ],
            },
          },
        ],
      },
      {
        id: 'future',
        label: 'Future Development',
        icon: '🔮',
        actionType: 'content',
        sections: [
          {
            heading: 'Future Development',
            bullets: [
              'Physical hardware prototype',
              'Real underwater acoustic testing',
              'Real sensor integration',
              'Advanced AI training',
              'Large-scale ocean deployment',
              'Enhanced recovery mechanisms',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tech',
    label: 'TECHNOLOGY & DEVICE',
    icon: '🧪',
    options: [
      {
        id: 'about-device',
        label: 'About the Device',
        icon: '📦',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'The prototype is an intelligent underwater communication device designed for deep-ocean network operation.',
          },
          {
            heading: 'The device concept includes',
            bullets: [
              'AI intelligence',
              'PRISM-based adaptive routing',
              'SNC network analytics',
              'Primary long-duration power',
              'Secondary high-power transmission support',
              'Local data storage',
              'Deep-ocean material considerations',
              'Emergency recovery mechanisms',
            ],
          },
        ],
      },
      {
        id: 'ai-intel',
        label: 'Programming Intelligence',
        icon: '🧠',
        actionType: 'content',
        sections: [
          {
            heading: 'Three-Stage AI Workflow',
            flow: ['ANALYZE', 'DECIDE', 'ACT'],
          },
          {
            heading: 'ANALYZE',
            paragraph: 'Evaluates:',
            bullets: [
              'Link health',
              'Node availability',
              'Route suitability',
              'Packet loss trends',
              'Latency thresholds',
              'Energy usage',
              'Failure conditions',
            ],
          },
          {
            heading: 'DECIDE',
            paragraph: 'AI uses PRISM routing to compare available communication paths.',
            bullets: [
              'Continue the current route',
              'Switch PRISM route',
              'Reroute communication',
              'Resend data',
              'Reduce power',
              'Enter emergency mode',
            ],
          },
          {
            heading: 'ACT',
            paragraph: 'Executes the selected response:',
            bullets: [
              'Route change',
              'Data resend',
              'Node avoidance',
              'Alternative link usage',
              'Power reduction',
              'Emergency recovery activation',
            ],
          },
        ],
      },
      {
        id: 'prism',
        label: 'PRISM Routing',
        icon: '🛣️',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'PRISM is the adaptive routing and decision framework used in the project.',
          },
          {
            heading: 'PRISM should',
            bullets: [
              'Monitor network conditions',
              'Compare available routes',
              'Evaluate communication paths',
              'Select the most suitable route',
              'Avoid failed nodes',
              'Use alternative links',
              'Reroute communication when required',
              'Support reliable data delivery',
            ],
          },
          {
            heading: 'Visual Data Flow',
            flow: ['SOURCE', 'ROUTE ANALYSIS', 'PRISM DECISION', 'BEST AVAILABLE ROUTE', 'DESTINATION'],
          },
        ],
      },
      {
        id: 'snc',
        label: 'SNC Analytics',
        icon: '📊',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'Stochastic Network Calculus is the network analytics approach used to analyze communication behavior.',
          },
          {
            heading: 'Metrics',
            bullets: [
              'Arrival Rate',
              'Service Rate',
              'Traffic Intensity',
              'Average Delay',
              'Maximum Delay',
              'Backlog',
              'Buffer Utilization',
              'Throughput',
              'Packet Loss',
              'Network Stability',
            ],
          },
          {
            heading: 'Stability Levels',
            stability: ['STABLE', 'WARNING', 'CRITICAL'],
          },
        ],
      },
      {
        id: 'primary-power',
        label: 'Primary Power Source',
        icon: '⚛️',
        actionType: 'content',
        sections: [
          {
            heading: 'MICRO NUCLEAR BATTERY',
            paragraph:
              'The primary source is intended as a long-duration baseline power concept for autonomous operation.',
          },
          {
            heading: 'Purpose',
            bullets: [
              'Continuous baseline power',
              'Long-duration operation',
              'AI monitoring',
              'Low-power processing',
              'System monitoring',
              'Secondary battery support',
            ],
          },
          {
            note: 'Primary power provides continuous low-level baseline energy.',
            accent: true,
          },
        ],
      },
      {
        id: 'secondary-power',
        label: 'Secondary Power Source',
        icon: '🔋',
        actionType: 'content',
        sections: [
          {
            heading: 'LITHIUM POLYMER BATTERY',
            paragraph: 'Its intended role:',
            bullets: [
              'High-power burst operations',
              'Acoustic signal transmission',
              'Short-duration high-energy requirements',
              'Communication bursts',
            ],
          },
          {
            note: 'The secondary battery supports high-power transmission demands while the primary source supports baseline system operation.',
            accent: true,
          },
        ],
      },
      {
        id: 'syntactic',
        label: 'Syntactic Foam',
        icon: '🧽',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'Syntactic foam is a lightweight composite material containing microscopic hollow spheres.',
          },
          {
            heading: 'Purpose',
            bullets: [
              'Low density',
              'Buoyancy support',
              'Water resistance',
              'High strength',
              'Deep-ocean material suitability',
            ],
          },
          {
            heading: 'Deployment Concept',
            paragraph:
              'An external ballast weight can be used to overcome buoyancy and allow the device to descend.',
          },
        ],
      },
      {
        id: 'local-1gb',
        label: 'Local 1GB Storage',
        icon: '💾',
        actionType: 'content',
        sections: [
          {
            paragraph: 'Local storage temporarily preserves communication data.',
          },
          {
            heading: 'Purpose',
            bullets: [
              'Store packets before forwarding',
              'Preserve data during communication interruptions',
              'Support retransmission',
              'Prevent immediate data loss',
              'Resend data after route recovery',
            ],
          },
        ],
      },
      {
        id: 'ballast',
        label: 'Ballast Release',
        icon: '⚓',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'An external weight is connected to the device using a controlled release mechanism.',
          },
          {
            heading: 'Purpose',
            bullets: [
              'Assist underwater descent',
              'Keep the device at operational depth',
              'Release the weight during critical failure',
              'Allow buoyancy to move the device upward',
            ],
          },
        ],
      },
      {
        id: 'emergency-recovery',
        label: 'Emergency Recovery',
        icon: '🆘',
        actionType: 'content',
        sections: [
          {
            heading: 'Complete Sequence',
            flow: [
              'CRITICAL FAILURE DETECTED',
              'ENTER LOW-POWER EMERGENCY MODE',
              'PRESERVE REMAINING ENERGY',
              'ACTIVATE BALLAST RELEASE',
              'EXTERNAL WEIGHT RELEASED',
              'BUOYANT DEVICE ASCENDS',
              'REACH SURFACE',
              'GPS / RECOVERY BEACON ACTIVATION',
            ],
          },
          {
            note: 'GPS signals cannot be reliably received at deep underwater locations. In this recovery concept, the device first ascends through buoyancy, and surface-level GPS or recovery tracking becomes available after reaching the surface.',
          },
        ],
      },
    ],
  },
  {
    id: 'network',
    label: 'NETWORK EXPLORER',
    icon: '🌐',
    options: [
      { id: 'interactive-map', label: 'Interactive Ocean Map', icon: '🗺️', actionType: 'page', page: 'overview' },
      { id: 'network-topology', label: 'Network Topology', icon: '🕸️', actionType: 'page', page: 'overview' },
      { id: 'prism-route', label: 'PRISM Active Route', icon: '✨', actionType: 'page', page: 'overview' },
      { id: 'device-health', label: 'Device Health', icon: '💊', actionType: 'page', page: 'health' },
      { id: 'acoustic-range', label: 'Acoustic Signal Range', icon: '📡', actionType: 'page', page: 'acoustic' },
      { id: 'energy-layer', label: 'Energy Layer', icon: '⚡', actionType: 'page', page: 'energy' },
      { id: 'latency-layer', label: 'Latency Layer', icon: '⏱️', actionType: 'page', page: 'snc' },
      { id: 'packet-loss-layer', label: 'Packet Loss Layer', icon: '📉', actionType: 'page', page: 'snc' },
    ],
  },
  {
    id: 'deep',
    label: 'EXPLORE THE DEEP',
    icon: '🐋',
    options: [
      {
        id: 'ocean-gallery',
        label: 'Ocean Gallery',
        icon: '🖼️',
        actionType: 'content',
        sections: [
          {
            heading: 'Ocean Gallery',
            paragraph:
              'Project-related ocean, device, deployment and prototype visuals.',
          },
          {
            heading: 'Purpose',
            bullets: [
              'Display project-related ocean imagery',
              'Device and deployment visuals',
              'Prototype design visuals',
              'Network visualization imagery',
            ],
          },
        ],
      },
      {
        id: 'listen-ocean',
        label: 'Listen to the Ocean',
        icon: '🎧',
        actionType: 'content',
        sections: [
          {
            heading: 'Categories',
            bullets: [
              'Whale Sounds',
              'Dolphin Sounds',
              'Snapping Shrimp',
              'Ship Noise',
              'Ambient Ocean',
              'Hydrophone Recordings',
            ],
          },
          {
            note: 'Audio playback is an exploration interface. Live audio requires a real hydrophone data source and is not currently connected.',
          },
        ],
      },
      {
        id: 'acoustic-signals',
        label: 'Acoustic Signals',
        icon: '〰️',
        actionType: 'content',
        sections: [
          {
            heading: 'Acoustic Communication Concept',
            bullets: [
              'Signal waveform visualization',
              'Communication frequency visualization',
              'Packet transmission visualization',
              'Spectrogram visualization',
            ],
          },
          {
            note: 'Visualizations are based on simulated communication models, not live underwater recordings.',
          },
        ],
      },
      {
        id: 'ocean-soundscape',
        label: 'Ocean Soundscape',
        icon: '🎵',
        actionType: 'content',
        sections: [
          {
            heading: 'Ocean Soundscape',
            paragraph:
              'A calm scientific ocean audio exploration interface for understanding underwater acoustic environments.',
          },
          {
            note: 'Research concept interface. Real soundscape playback requires a connected hydrophone or curated audio source.',
          },
        ],
      },
      {
        id: 'data-viz',
        label: 'Data Visualization',
        icon: '📈',
        actionType: 'content',
        sections: [
          {
            heading: 'Environmental & Network Visualizations',
            bullets: [
              'Temperature',
              'Pressure',
              'Depth',
              'Acoustic frequency',
              'Signal strength',
              'Packet loss',
              'Latency',
              'Energy level',
              'Node health',
            ],
          },
          {
            note: 'Simulation-derived values unless a real external data source is connected.',
          },
        ],
      },
    ],
  },
  {
    id: 'data',
    label: 'DATA & ANALYTICS',
    icon: '🧮',
    options: [
      {
        id: 'bigdata-overview',
        label: 'Big Data Overview',
        icon: '☁️',
        actionType: 'content',
        sections: [
          {
            heading: 'Architecture',
            flow: [
              'DATA GENERATION',
              'KAFKA STREAMING',
              'SPARK STRUCTURED STREAMING',
              'SCALA ANALYTICS',
              'CASSANDRA STORAGE',
              'DASHBOARD VISUALIZATION',
            ],
          },
        ],
      },
      {
        id: 'spark',
        label: 'Spark Analytics',
        icon: '⚙️',
        actionType: 'content',
        sections: [
          {
            heading: 'Apache Spark Structured Streaming',
            paragraph:
              'Processes the continuous telemetry and network event stream emitted by the underwater communication system.',
          },
          {
            heading: 'Capabilities',
            bullets: [
              'Real-time stream processing (simulated)',
              'SNC metric aggregation',
              'Packet loss / latency windowing',
              'Micro-batch analytics',
            ],
          },
        ],
      },
      {
        id: 'scala',
        label: 'Scala Processing',
        icon: '🛠️',
        actionType: 'content',
        sections: [
          {
            heading: 'Scala Analytics Layer',
            paragraph:
              'Implements the core analytics computations for SNC and PRISM evaluation.',
          },
          {
            bullets: [
              'Delay bound computation',
              'Service curve analysis',
              'Route cost evaluation',
            ],
          },
        ],
      },
      {
        id: 'kafka',
        label: 'Kafka Streaming',
        icon: '📨',
        actionType: 'content',
        sections: [
          {
            heading: 'Apache Kafka Message Bus',
            paragraph:
              'Carries device telemetry and network events between the simulation, analytics and dashboard layers.',
          },
          {
            bullets: ['Topic-based streaming', 'Event buffering', 'Fault-tolerant delivery'],
          },
        ],
      },
      {
        id: 'cassandra',
        label: 'Cassandra Storage',
        icon: '🗄️',
        actionType: 'content',
        sections: [
          {
            heading: 'Cassandra Database',
            paragraph:
              'Stores historical simulation data for long-term analytics and dashboard history views.',
          },
          {
            bullets: ['Time-series telemetry', 'Alert history', 'Device state snapshots'],
          },
        ],
      },
      {
        id: 'network-metrics',
        label: 'Network Metrics',
        icon: '📏',
        actionType: 'content',
        sections: [
          {
            heading: 'Key Metrics',
            bullets: [
              'Latency',
              'Throughput',
              'Packet Loss',
              'Traffic Intensity',
              'Service Rate',
              'Backlog',
              'Buffer Utilization',
              'Stability',
            ],
          },
        ],
      },
      {
        id: 'data-pipeline',
        label: 'Data Pipeline',
        icon: '🔁',
        actionType: 'content',
        sections: [
          {
            heading: 'Pipeline Stages',
            flow: ['SENSORS', 'SUB-NODES', 'MAIN NODE', 'KAFKA', 'SPARK', 'SCALA', 'CASSANDRA', 'DASHBOARD'],
          },
        ],
      },
    ],
  },
  {
    id: 'visualization',
    label: 'VISUALIZATION',
    icon: '🎛️',
    options: [
      {
        id: '3d-prototype',
        label: '3D Device Prototype',
        icon: '🧊',
        actionType: 'page',
        page: 'overview',
      },
      { id: 'ocean-sim', label: 'Ocean Network Simulation', icon: '🌊', actionType: 'page', page: 'overview' },
      { id: 'data-flow-viz', label: 'Data Flow Visualization', icon: '💧', actionType: 'page', page: 'bigdata' },
      { id: 'comm-arch', label: 'Communication Architecture', icon: '🏗️', actionType: 'page', page: 'overview' },
      {
        id: 'system-flow',
        label: 'System Flow',
        icon: '🧬',
        actionType: 'content',
        sections: [
          {
            heading: 'System Flow',
            flow: [
              'SENSORS',
              'SUB-NODES',
              'MAIN NODE',
              'SURFACE RECEIVER',
              'LAND DATA CENTER',
              'BIG DATA ANALYTICS',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'appearance',
    label: 'APPEARANCE',
    icon: '🎨',
    options: [
      { id: 'theme-dark', label: 'Dark Ocean Theme (Default)', icon: '🌙', actionType: 'theme', theme: 'dark' },
    ],
  },
  {
    id: 'project',
    label: 'PROJECT INFORMATION',
    icon: '📚',
    options: [
      {
        id: 'about-project',
        label: 'About the Project',
        icon: '📖',
        actionType: 'content',
        sections: [
          {
            paragraph:
              'An intelligent underwater acoustic communication and deep-ocean network research prototype.',
          },
          {
            bullets: [
              'Autonomous deep-ocean communication',
              'Artificial intelligence integration',
              'Adaptive routing research',
              'Network analytics research',
            ],
          },
        ],
      },
      {
        id: 'system-arch',
        label: 'System Architecture',
        icon: '🧩',
        actionType: 'content',
        sections: [
          {
            heading: 'Layered Architecture',
            flow: [
              'UNDERWATER SENSOR LAYER',
              'COMMUNICATION NODE LAYER',
              'ANALYTICS LAYER',
              'DATA STORAGE LAYER',
              'DASHBOARD LAYER',
            ],
          },
        ],
      },
      {
        id: 'research-concept',
        label: 'Research Concept',
        icon: '🔬',
        actionType: 'content',
        sections: [
          {
            heading: 'Research Concept',
            paragraph:
              'A research prototype exploring autonomous underwater communication with adaptive, failure-tolerant routing.',
          },
          {
            bullets: [
              'Adaptive acoustic communication',
              'Autonomous decision-making',
              'Network resilience research',
              'Deep-ocean deployment concepts',
            ],
          },
        ],
      },
      {
        id: 'project-status',
        label: 'Project Status',
        icon: '📍',
        actionType: 'content',
        sections: [
          {
            heading: 'Current Status',
            bullets: [
              'Simulation and dashboard implementation',
              'AI monitoring logic',
              'PRISM routing concept',
              'SNC analytics implementation',
              'Hybrid power concept',
              'Emergency recovery concept',
              'Future physical prototype development',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    label: 'ACCOUNT',
    icon: '👤',
    options: [
      {
        id: 'profile',
        label: 'Profile',
        icon: '🪪',
        actionType: 'content',
        sections: [
          {
            heading: 'Profile',
            bullets: ['Operator access', 'Mission context: Underwater Intelligence Dashboard', 'Role: Research / Operator'],
          },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        actionType: 'content',
        sections: [
          {
            heading: 'Settings',
            bullets: ['Theme preference', 'Navigation preference', 'Notification display'],
          },
        ],
      },
      { id: 'logout', label: 'Logout', icon: '🚪', actionType: 'logout' },
    ],
  },
];