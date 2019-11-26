import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import createCachedSelector from 're-reselect';
import {
  getTooltipValuesAndGeometriesSelector,
  TooltipAndHighlightedGeoms,
} from './get_tooltip_values_highlighted_geoms';
import { SettingsSpec } from '../../../../specs';
import { GlobalChartState } from '../../../../state/chart_state';
import { IndexedGeometry } from '../../../../utils/geometry';
import { Selector } from 'react-redux';
import { ChartTypes } from '../../../index';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

interface Props {
  settings: SettingsSpec | undefined;
  highlightedGeometries: IndexedGeometry[];
}

function isOutElement(prevProps: Props | null, nextProps: Props | null) {
  if (!nextProps || !prevProps) {
    return false;
  }
  if (!nextProps.settings || !nextProps.settings.onElementOut) {
    return false;
  }
  if (prevProps.highlightedGeometries.length > 0 && nextProps.highlightedGeometries.length === 0) {
    return true;
  }
  return false;
}

/**
 * Will call the onElementOut listener every time the following preconditions are met:
 * - the onElementOut listener is available
 * - the highlighted geometries list goes from a list of at least one object to an empty one
 */
export function createOnElementOutCaller(): (state: GlobalChartState) => void {
  let prevProps: Props | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
      selector = createCachedSelector(
        [getTooltipValuesAndGeometriesSelector, getSettingsSpecSelector],
        ({ highlightedGeometries }: TooltipAndHighlightedGeoms, settings: SettingsSpec): void => {
          const nextProps = {
            settings,
            highlightedGeometries,
          };

          if (isOutElement(prevProps, nextProps) && settings.onElementOut) {
            settings.onElementOut();
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
