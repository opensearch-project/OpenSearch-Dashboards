import { GlobalChartState, BackwardRef } from '../chart_state';

type ChartRendererFn = (
  containerRef: BackwardRef,
  forwardStageRef: React.RefObject<HTMLCanvasElement>,
) => JSX.Element | null;

export const getInternalChartRendererSelector = (state: GlobalChartState): ChartRendererFn => {
  if (state.internalChartState) {
    return state.internalChartState.chartRenderer;
  } else {
    return () => null;
  }
};
