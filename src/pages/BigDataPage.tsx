import type { SimulationState } from '../hooks/useSimulation';
import { BigDataLabPage } from './BigDataLabPage';

interface Props {
  state: SimulationState;
}

export function BigDataPage({ state }: Props) {
  return <BigDataLabPage state={state} />;
}
