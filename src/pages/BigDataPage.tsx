import type { SimulationState } from '../hooks/useSimulation';
import { DataAnalytics } from './DataAnalytics';

interface Props {
  state: SimulationState;
}

export function BigDataPage({ state }: Props) {
  return <DataAnalytics state={state} />;
}
