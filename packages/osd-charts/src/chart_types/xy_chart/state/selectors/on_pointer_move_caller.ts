import createCachedSelector from 're-reselect';
import { Selector } from 'reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { SettingsSpec, CursorEvent } from '../../../../specs';
import { ChartTypes } from '../../../index';
import { Scale } from '../../../../utils/scales/scales';
import { Point } from '../../../../utils/point';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getPointerEventSelector = createCachedSelector(
  [
    getChartIdSelector,
    getOrientedProjectedPointerPositionSelector,
    computeSeriesGeometriesSelector,
    getGeometriesIndexKeysSelector,
  ],
  (chartId, orientedProjectedPointerPosition, seriesGeometries, geometriesIndexKeys) => {
    return getCursorBand(
      chartId,
      orientedProjectedPointerPosition,
      seriesGeometries.scales.xScale,
      geometriesIndexKeys,
    );
  },
)(getChartIdSelector);

function getCursorBand(
  chartId: string,
  orientedProjectedPoinerPosition: Point,
  xScale: Scale | undefined,
  geometriesIndexKeys: any[],
): CursorEvent | null {
  // update che cursorBandPosition based on chart configuration
  if (!xScale) {
    return null;
  }
  const { x, y } = orientedProjectedPoinerPosition;
  if (x === -1 || y === -1) {
    return null;
  }
  const xValue = xScale.invertWithStep(x, geometriesIndexKeys);
  if (!xValue) {
    return null;
  }
  return {
    chartId,
    scale: xScale.type,
    unit: xScale.unit,
    value: xValue.value,
  };
}
interface Props {
  settings: SettingsSpec;
  pointerEvent: CursorEvent | null;
}

function hasPointerEventChanged(prevProps: Props, nextProps: Props | null) {
  // new pointer event, pointer over
  if (prevProps.pointerEvent === null && nextProps && nextProps.pointerEvent) {
    return true;
  }

  // new pointer event, pointer out
  if (prevProps.pointerEvent !== null && nextProps && nextProps.pointerEvent === null) {
    return true;
  }

  const prevPointerEvent = prevProps.pointerEvent;
  const nextPointerEvent = nextProps && nextProps.pointerEvent;

  // if something changed in the pointerEvent than recompute
  if (
    prevPointerEvent !== null &&
    nextPointerEvent !== null &&
    (prevPointerEvent.value !== nextPointerEvent.value ||
      prevPointerEvent.scale !== nextPointerEvent.scale ||
      prevPointerEvent.unit !== nextPointerEvent.unit)
  ) {
    return true;
  }
  return false;
}

export function createOnPointerMoveCaller(): (state: GlobalChartState) => void {
  let prevProps: Props | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
      selector = createCachedSelector(
        [getSettingsSpecSelector, getPointerEventSelector],
        (settings: SettingsSpec, pointerEvent: CursorEvent | null): void => {
          const nextProps = {
            settings,
            pointerEvent,
          };

          if (prevProps === null && nextProps.pointerEvent === null) {
            prevProps = nextProps;
            return;
          }
          if (settings && settings.onCursorUpdate && hasPointerEventChanged(prevProps!, nextProps)) {
            settings.onCursorUpdate(pointerEvent ? pointerEvent : undefined);
          }
          prevProps = nextProps;
        },
      )({
        keySelector: getChartIdSelector,
      });
    }
    if (selector) {
      selector(state);
    }
  };
}
