import { GlobalChartState, BackwardRef } from '../chart_state';
import { Stage } from 'react-konva';

type ChartRendererFn = (containerRef: BackwardRef, forwardStageRef: React.RefObject<Stage>) => JSX.Element | null;

export const getInternalChartRendererSelector = (state: GlobalChartState): ChartRendererFn => {
  if (state.internalChartState) {
    return state.internalChartState.chartRenderer;
  } else {
    return () => null;
  }
};
