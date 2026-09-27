import type { MenuOption } from '../../data/menuContent';
import type { SimulationState } from '../../hooks/useSimulation';
import { ExplorePortal } from '../explore/ExplorePortal';
import { DeviceExplorer } from '../explore/DeviceExplorer';
import { OceanGallery } from '../explore/OceanGallery';
import { ListenToOcean } from '../explore/ListenToOcean';
import { AcousticSignals } from '../explore/AcousticSignals';
import { OceanSoundscape } from '../explore/OceanSoundscape';
import { DataVisualizationView } from './DataVisualizationView';
import { SystemArchitectureView } from './SystemArchitectureView';
import { ResearchConceptView } from './ResearchConceptView';
import { ProjectStatusView } from './ProjectStatusView';
import { ProfileView } from './ProfileView';
import { SettingsView } from './SettingsView';
import { BigDataOverviewView } from './data/BigDataOverviewView';
import { SparkAnalyticsView } from './data/SparkAnalyticsView';
import { ScalaProcessingView } from './data/ScalaProcessingView';
import { KafkaStreamingView } from './data/KafkaStreamingView';
import { CassandraStorageView } from './data/CassandraStorageView';
import { NetworkMetricsView } from './data/NetworkMetricsView';
import { DataPipelineView } from './data/DataPipelineView';
import { AboutProjectView } from './AboutProjectView';
import { BackButton } from './BackButton';
import './AboutProjectView.css';
import './Menu.css';

const EXPLORE_IDS = new Set(['vision', 'mission-arch', 'system-mission', 'milestones', 'future']);
const DEVICE_IDS = new Set(['about-device','ai-intel','prism','snc','primary-power','secondary-power','syntactic','local-1gb','ballast','emergency-recovery']);

interface Props {
  option: MenuOption;
  state?: SimulationState | null;
  onNavigatePage?: (page: string) => void;
}

export function MenuContentView({ option, state = null, onNavigatePage }: Props) {
  if (option.id === 'ocean-gallery') {
    return <OceanGallery option={option} />;
  }
  if (option.id === 'listen-ocean') {
    return <ListenToOcean option={option} />;
  }
  if (option.id === 'acoustic-signals') {
    return <AcousticSignals option={option} />;
  }
  if (option.id === 'ocean-soundscape') {
    return <OceanSoundscape option={option} />;
  }
  if (option.id === 'data-viz') {
    return <DataVisualizationView option={option} />;
  }
  if (option.id === 'system-arch') {
    return <SystemArchitectureView option={option} />;
  }
  if (option.id === 'research-concept') {
    return <ResearchConceptView option={option} />;
  }
  if (option.id === 'project-status') {
    return <ProjectStatusView option={option} />;
  }
  if (option.id === 'profile') {
    return <ProfileView option={option} />;
  }
  if (option.id === 'settings') {
    return <SettingsView option={option} onNavigatePage={onNavigatePage} />;
  }
  if (option.id === 'bigdata-overview') {
    return <BigDataOverviewView option={option} state={state} />;
  }
  if (option.id === 'spark') {
    return <SparkAnalyticsView option={option} state={state} />;
  }
  if (option.id === 'scala') {
    return <ScalaProcessingView option={option} state={state} />;
  }
  if (option.id === 'kafka') {
    return <KafkaStreamingView option={option} state={state} />;
  }
  if (option.id === 'cassandra') {
    return <CassandraStorageView option={option} state={state} />;
  }
  if (option.id === 'network-metrics') {
    return <NetworkMetricsView option={option} state={state} />;
  }
  if (option.id === 'data-pipeline') {
    return <DataPipelineView option={option} state={state} />;
  }
  if (option.id === 'about-project') {
    return <AboutProjectView option={option} state={state} />;
  }
  if (EXPLORE_IDS.has(option.id)) {
    return <ExplorePortal initialSection={option.id} />;
  }
  if (DEVICE_IDS.has(option.id)) {
    return <DeviceExplorer initialSection={option.id} />;
  }
  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
          </div>
        </div>
        <BackButton />
      </div>

      <div className="menu-content-body">
        {option.sections?.map((s, i) => (
          <div className={`mc-section${s.accent ? ' mc-accent' : ''}`} key={i}>
            {s.heading && <h4 className="mc-heading">{s.heading}</h4>}
            {s.paragraph && <p className="mc-paragraph">{s.paragraph}</p>}

            {s.flow && (
              <div className="mc-flow">
                {s.flow.map((step, j, arr) => (
                  <div className="mc-flow-item" key={step}>
                    <span className="mc-flow-box">{step}</span>
                    {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
                  </div>
                ))}
              </div>
            )}

            {s.bullets && (
              <ul className="mc-bullets">
                {s.bullets.map(b => <li key={b}>• {b}</li>)}
              </ul>
            )}

            {s.stability && (
              <div className="mc-stability">
                {s.stability.map((st, i) => (
                  <span className={`mc-stability-chip ${st.toLowerCase()}`} key={st}>
                    {i + 1}. {st}
                  </span>
                ))}
              </div>
            )}

            {s.items && (
              <div className="mc-items">
                {s.items.map(item => (
                  <div className="mc-item" key={item.title}>
                    {item.num && <span className="mc-item-num">{item.num}</span>}
                    <div>
                      <div className="mc-item-title">{item.title}</div>
                      {item.desc && <div className="mc-item-desc">{item.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {s.checklist && (
              <div className="mc-checklist">
                {s.checklist.done && s.checklist.done.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">COMPLETED</div>
                    {s.checklist.done.map(c => <div className="mc-check-item done" key={c}>✓ {c}</div>)}
                  </div>
                )}
                {s.checklist.inProgress && s.checklist.inProgress.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">IN PROGRESS</div>
                    {s.checklist.inProgress.map(c => <div className="mc-check-item progress" key={c}>◉ {c}</div>)}
                  </div>
                )}
                {s.checklist.future && s.checklist.future.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">FUTURE DEVELOPMENT</div>
                    {s.checklist.future.map(c => <div className="mc-check-item future" key={c}>• {c}</div>)}
                  </div>
                )}
              </div>
            )}

            {s.note && <div className="mc-note">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}