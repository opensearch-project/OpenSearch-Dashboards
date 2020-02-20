import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import createCachedSelector from 're-reselect';
import {
  getTooltipInfoAndGeometriesSelector,
  TooltipAndHighlightedGeoms,
} from './get_tooltip_values_highlighted_geoms';
import { SettingsSpec } from '../../../../specs';
import { GlobalChartState } from '../../../../state/chart_state';
import { IndexedGeometry, GeometryValue } from '../../../../utils/geometry';
import { Selector } from 'react-redux';
import { ChartTypes } from '../../../index';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { XYChartSeriesIdentifier } from '../../utils/series';

interface Props {
  settings: SettingsSpec | undefined;
  highlightedGeometries: IndexedGeometry[];
}

function isOverElement(prevProps: Props | null, nextProps: Props | null) {
  if (!nextProps) {
    return false;
  }
  if (!nextProps.settings || !nextProps.settings.onElementOver) {
    return false;
  }
  const { highlightedGeometries: nextGeomValues } = nextProps;
  const prevGeomValues = prevProps ? prevProps.highlightedGeometries : [];
  if (nextGeomValues.length > 0) {
    if (nextGeomValues.length !== prevGeomValues.length) {
      return true;
    }
    return !nextGeomValues.every(({ value: next }, index) => {
      const prev = prevGeomValues[index].value;
      return prev && prev.x === next.x && prev.y === next.y && prev.accessor === next.accessor;
    });
  }

  return false;
}

/**
 * Will call the onElementOver listener every time the following preconditions are met:
 * - the onElementOver listener is available
 * - we have a new set of highlighted geometries on our state
 */
export function createOnElementOverCaller(): (state: GlobalChartState) => void {
  let prevProps: Props | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
      selector = createCachedSelector(
        [getTooltipInfoAndGeometriesSelector, getSettingsSpecSelector],
        ({ highlightedGeometries }: TooltipAndHighlightedGeoms, settings: SettingsSpec): void => {
          const nextProps = {
            settings,
            highlightedGeometries,
          };

          if (isOverElement(prevProps, nextProps) && settings.onElementOver) {
            const elements = highlightedGeometries.map<[GeometryValue, XYChartSeriesIdentifier]>(
              ({ value, seriesIdentifier }) => [value, seriesIdentifier],
            );
            settings.onElementOver(elements);
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
