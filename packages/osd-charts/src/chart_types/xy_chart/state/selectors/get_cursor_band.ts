import { Dimensions } from '../../../../utils/dimensions';
import createCachedSelector from 're-reselect';
import { Point } from '../../../../utils/point';
import { Scale } from '../../../../utils/scales/scales';
import { isLineAreaOnlyChart } from '../utils';
import { getCursorBandPosition } from '../../crosshair/crosshair_utils';
import { SettingsSpec, CursorEvent } from '../../../../specs/settings';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { BasicSeriesSpec } from '../../utils/specs';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { getSeriesSpecsSelector } from './get_specs';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { isTooltipSnapEnableSelector } from './is_tooltip_snap_enabled';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { GlobalChartState } from '../../../../state/chart_state';
import { isValidExternalPointerEvent } from '../../../../utils/events';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

export const getCursorBandPositionSelector = createCachedSelector(
  [
    getOrientedProjectedPointerPositionSelector,
    getExternalPointerEventStateSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    computeSeriesGeometriesSelector,
    getSeriesSpecsSelector,
    countBarsInClusterSelector,
    isTooltipSnapEnableSelector,
    getGeometriesIndexKeysSelector,
  ],
  (
    orientedProjectedPointerPosition,
    externalPointerEvent,
    chartDimensions,
    settingsSpec,
    seriesGeometries,
    seriesSpec,
    totalBarsInCluster,
    isTooltipSnapEnabled,
    geometriesIndexKeys,
  ) => {
    return getCursorBand(
      orientedProjectedPointerPosition,
      externalPointerEvent,
      chartDimensions.chartDimensions,
      settingsSpec,
      seriesGeometries.scales.xScale,
      seriesSpec,
      totalBarsInCluster,
      isTooltipSnapEnabled,
      geometriesIndexKeys,
    );
  },
)(getChartIdSelector);

function getCursorBand(
  orientedProjectedPoinerPosition: Point,
  externalPointerEvent: CursorEvent | null,
  chartDimensions: Dimensions,
  settingsSpec: SettingsSpec,
  xScale: Scale | undefined,
  seriesSpecs: BasicSeriesSpec[],
  totalBarsInCluster: number,
  isTooltipSnapEnabled: boolean,
  geometriesIndexKeys: any[],
): Dimensions & { visible: boolean } | undefined {
  // update che cursorBandPosition based on chart configuration
  const isLineAreaOnly = isLineAreaOnlyChart(seriesSpecs);
  if (!xScale) {
    return;
  }
  let pointerPosition = orientedProjectedPoinerPosition;
  let xValue;
  if (externalPointerEvent && isValidExternalPointerEvent(externalPointerEvent, xScale)) {
    const x = xScale.pureScale(externalPointerEvent.value);

    if (x == null || x > chartDimensions.width + chartDimensions.left) {
      return;
    }
    pointerPosition = { x, y: 0 };
    xValue = {
      value: externalPointerEvent.value,
      withinBandwidth: true,
    };
  } else {
    xValue = xScale.invertWithStep(orientedProjectedPoinerPosition.x, geometriesIndexKeys);
    if (!xValue) {
      return;
    }
  }
  return getCursorBandPosition(
    settingsSpec.rotation,
    chartDimensions,
    pointerPosition,
    {
      value: xValue.value,
      withinBandwidth: true,
    },
    isTooltipSnapEnabled,
    xScale,
    isLineAreaOnly ? 1 : totalBarsInCluster,
  );
}
