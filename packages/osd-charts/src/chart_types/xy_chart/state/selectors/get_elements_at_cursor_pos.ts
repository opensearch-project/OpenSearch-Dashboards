import createCachedSelector from 're-reselect';
import { Point } from '../../../../utils/point';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { ComputedScales } from '../utils';
import { getComputedScalesSelector } from './get_computed_scales';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getGeometriesIndexSelector } from './get_geometries_index';
import { IndexedGeometry } from '../../../../utils/geometry';
import { CursorEvent } from '../../../../specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { Dimensions } from '../../../../utils/dimensions';
import { GlobalChartState } from '../../../../state/chart_state';
import { isValidExternalPointerEvent } from '../../../../utils/events';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

export const getElementAtCursorPositionSelector = createCachedSelector(
  [
    getOrientedProjectedPointerPositionSelector,
    getComputedScalesSelector,
    getGeometriesIndexKeysSelector,
    getGeometriesIndexSelector,
    getExternalPointerEventStateSelector,
    computeChartDimensionsSelector,
  ],
  getElementAtCursorPosition,
)(getChartIdSelector);

function getElementAtCursorPosition(
  orientedProjectedPoinerPosition: Point,
  scales: ComputedScales,
  geometriesIndexKeys: any,
  geometriesIndex: Map<any, IndexedGeometry[]>,
  externalPointerEvent: CursorEvent | null,
  {
    chartDimensions,
  }: {
    chartDimensions: Dimensions;
  },
): IndexedGeometry[] {
  if (externalPointerEvent && isValidExternalPointerEvent(externalPointerEvent, scales.xScale)) {
    const x = scales.xScale.pureScale(externalPointerEvent.value);

    if (x == null || x > chartDimensions.width + chartDimensions.left) {
      return [];
    }
    return geometriesIndex.get(externalPointerEvent.value) || [];
  }
  const xValue = scales.xScale.invertWithStep(orientedProjectedPoinerPosition.x, geometriesIndexKeys);
  if (!xValue) {
    return [];
  }
  // get the elements on at this cursor position
  return geometriesIndex.get(xValue.value) || [];
}
