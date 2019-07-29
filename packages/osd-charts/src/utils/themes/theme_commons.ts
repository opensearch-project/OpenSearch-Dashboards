import { Margins } from '../dimensions';
import { SharedGeometryStyle } from './theme';

export const DEFAULT_MISSING_COLOR = 'red';

export const DEFAULT_CHART_PADDING: Margins = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
export const DEFAULT_CHART_MARGINS: Margins = {
  left: 10,
  right: 10,
  top: 10,
  bottom: 10,
};

export const DEFAULT_GEOMETRY_STYLES: SharedGeometryStyle = {
  default: {
    opacity: 1,
  },
  highlighted: {
    opacity: 1,
  },
  unhighlighted: {
    opacity: 0.25,
  },
};
