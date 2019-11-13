import { DataSeriesDatum } from '../../chart_types/xy_chart/utils/series';
import { getYValue } from '../../chart_types/xy_chart/rendering/rendering';

/**
 * Helper function to return array of rendered y1 values
 */
export const getFilledNullData = (data: DataSeriesDatum[]): (number | undefined)[] => {
  return data.filter(({ y1 }) => y1 === null).map(({ filled }) => filled && filled.y1);
};

/**
 * Helper function to return array of rendered y1 values
 */
export const getFilledNonNullData = (data: DataSeriesDatum[]): (number | undefined)[] => {
  return data.filter(({ y1 }) => y1 !== null).map(({ filled }) => filled && filled.y1);
};

/**
 * Helper function to return array of rendered x values
 */
export const getXValueData = (data: DataSeriesDatum[]): (number | string)[] => {
  return data.map(({ x }) => x);
};

/**
 * Returns value of `y1` or `filled.y1` or null
 */
export const getYResolvedData = (data: DataSeriesDatum[]): (number | null)[] => {
  return data.map(getYValue);
};
