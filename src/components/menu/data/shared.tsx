import type { MenuOption } from '../../../data/menuContent';
import type { SimulationState } from '../../../hooks/useSimulation';
import { BackButton } from '../BackButton';
import '../../menu/Menu.css';
import './DataAnalyticsViews.css';

export interface DataViewProps {
  option: MenuOption;
  state: SimulationState | null;
}

export function DataViewHeader({ option, subtitle }: {
  option: MenuOption;
  subtitle: string;
}) {
  return (
    <div className="menu-content-header">
      <div className="menu-content-title">
        <span className="menu-content-icon">{option.icon}</span>
        <div>
          <div className="menu-content-label">{option.label}</div>
        </div>
      </div>
      <BackButton />
      <p className="da-lead" style={{ width: '100%', margin: 0 }}>{subtitle}</p>
    </div>
  );
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
