import { SeriesKey } from '../../chart_types/xy_chart/utils/series';
import { Color } from '../../utils/commons';

export const CLEAR_TEMPORARY_COLORS = 'CLEAR_TEMPORARY_COLORS';
export const SET_TEMPORARY_COLOR = 'SET_TEMPORARY_COLOR';
export const SET_PERSISTED_COLOR = 'SET_PERSISTED_COLOR';

interface ClearTemporaryColors {
  type: typeof CLEAR_TEMPORARY_COLORS;
}

interface SetTemporaryColor {
  type: typeof SET_TEMPORARY_COLOR;
  key: SeriesKey;
  color: Color;
}

interface SetPersistedColor {
  type: typeof SET_PERSISTED_COLOR;
  key: SeriesKey;
  color: Color;
}

export function clearTemporaryColors(): ClearTemporaryColors {
  return { type: CLEAR_TEMPORARY_COLORS };
}

export function setTemporaryColor(key: SeriesKey, color: Color): SetTemporaryColor {
  return { type: SET_TEMPORARY_COLOR, key, color };
}

export function setPersistedColor(key: SeriesKey, color: Color): SetPersistedColor {
  return { type: SET_PERSISTED_COLOR, key, color };
}

export type ColorsActions = ClearTemporaryColors | SetTemporaryColor | SetPersistedColor;
