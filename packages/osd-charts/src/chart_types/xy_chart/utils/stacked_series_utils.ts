import { DataSeries, DataSeriesDatum, RawDataSeries, RawDataSeriesDatum, FilledValues } from './series';
import { ScaleType } from '../../../utils/scales/scales';

interface StackedValues {
  values: number[];
  percent: number[];
  total: number;
}

/**
 * Map each y value from a RawDataSeries on it's specific x value into,
 * ordering the stack based on the dataseries index.
 * @param dataseries
 */
export function getYValueStackMap(
  dataseries: RawDataSeries[],
  xValues: Set<string | number>,
): Map<string | number, number[]> {
  const stackMap = new Map<string | number, number[]>();
  const missingXValues = new Set([...xValues]);
  dataseries.forEach((ds, index) => {
    ds.data.forEach((datum) => {
      const stack = stackMap.get(datum.x) || new Array(dataseries.length).fill(0);
      stack[index] = datum.y1;
      stackMap.set(datum.x, stack);
      if (xValues.has(datum.x)) {
        missingXValues.delete(datum.x);
      }
    });
    for (const x of missingXValues.values()) {
      const stack = stackMap.get(x) || new Array(dataseries.length).fill(0);
      // currently filling as 0 value
      stack[index] = 0;
      stackMap.set(x, stack);
    }
  });
  return stackMap;
}

/**
 * For each key of the yValueStackMap, it stacks the values one after the other,
 * summing the previous value to the next one.
 * @param yValueStackMap
 * @param scaleToExtent
 */
export function computeYStackedMapValues(
  yValueStackMap: Map<any, number[]>,
  scaleToExtent: boolean,
): Map<any, StackedValues> {
  const stackedValues = new Map<any, StackedValues>();

  yValueStackMap.forEach((yStackArray, xValue) => {
    const stackArray = yStackArray.reduce(
      (acc, currentValue, index) => {
        if (acc.values.length === 0) {
          if (scaleToExtent) {
            return {
              values: [currentValue, currentValue],
              total: currentValue,
            };
          }
          return {
            values: [0, currentValue],
            total: currentValue,
          };
        }
        return {
          values: [...acc.values, acc.values[index] + currentValue],
          total: acc.total + currentValue,
        };
      },
      {
        values: [] as number[],
        total: 0,
      },
    );
    const percent = stackArray.values.map((value) => {
      return value / stackArray.total;
    });
    stackedValues.set(xValue, {
      values: stackArray.values,
      percent,
      total: stackArray.total,
    });
  });
  return stackedValues;
}

export function formatStackedDataSeriesValues(
  dataseries: RawDataSeries[],
  scaleToExtent: boolean,
  isPercentageMode: boolean,
  xValues: Set<string | number>,
  xScaleType: ScaleType,
): DataSeries[] {
  const yValueStackMap = getYValueStackMap(dataseries, xValues);
  const stackedValues = computeYStackedMapValues(yValueStackMap, scaleToExtent);

  const stackedDataSeries: DataSeries[] = dataseries.map((ds, seriesIndex) => {
    const newData: DataSeriesDatum[] = [];
    const missingXValues = new Set([...xValues]);
    ds.data.forEach((data) => {
      const formattedSeriesDatum = getStackedFormattedSeriesDatum(
        data,
        stackedValues,
        seriesIndex,
        scaleToExtent,
        isPercentageMode,
      );
      if (formattedSeriesDatum === undefined) {
        return;
      }
      missingXValues.delete(data.x);
      newData.push(formattedSeriesDatum);
    });
    for (const x of missingXValues.values()) {
      const filledSeriesDatum = getStackedFormattedSeriesDatum(
        {
          x,
          // filling as 0 value
          y1: 0,
        },
        stackedValues,
        seriesIndex,
        scaleToExtent,
        isPercentageMode,
        {
          x,
          // filling as 0 value
          y1: 0,
        },
      );
      if (filledSeriesDatum) {
        newData.push(filledSeriesDatum);
      }
    }
    newData.sort((a, b) => {
      if (xScaleType === ScaleType.Ordinal || typeof a.x === 'string' || typeof b.x === 'string') {
        return 0;
      }
      return a.x - b.x;
    });
    return {
      specId: ds.specId,
      key: ds.key,
      seriesColorKey: ds.seriesColorKey,
      data: newData,
    };
  });

  return stackedDataSeries;
}

function getStackedFormattedSeriesDatum(
  data: RawDataSeriesDatum,
  stackedValues: Map<any, StackedValues>,
  seriesIndex: number,
  scaleToExtent: boolean,
  isPercentageMode = false,
  filled?: Partial<FilledValues>,
): DataSeriesDatum | undefined {
  const { x, datum } = data;
  const stack = stackedValues.get(x);
  if (!stack) {
    return;
  }
  let y1: number | null = null;
  if (isPercentageMode) {
    y1 = data.y1 != null ? data.y1 / stack.total : null;
  } else {
    y1 = data.y1;
  }
  const y0 = isPercentageMode && data.y0 != null ? data.y0 / stack.total : data.y0;
  let computedY0: number | null;
  if (scaleToExtent) {
    computedY0 = y0 ? y0 : y1;
  } else {
    computedY0 = y0 ? y0 : null;
  }
  const initialY0 = y0 == null ? null : y0;

  if (seriesIndex === 0) {
    return {
      x,
      y1,
      y0: computedY0,
      initialY1: y1,
      initialY0,
      datum,
      ...(filled && { filled }),
    };
  } else {
    const stackY = isPercentageMode ? stack.percent[seriesIndex] : stack.values[seriesIndex];
    let stackedY1: number | null = null;
    let stackedY0: number | null = null;
    if (isPercentageMode) {
      stackedY1 = y1 !== null ? stackY + y1 : null;
      stackedY0 = y0 != null ? stackY + y0 : stackY;
    } else {
      stackedY1 = y1 !== null ? stackY + y1 : null;
      stackedY0 = y0 != null ? stackY + y0 : stackY;
      // configure null y0 if y1 is null
      // it's semantically right to say y0 is null if y1 is null
      if (stackedY1 === null) {
        stackedY0 = null;
      }
    }

    return {
      x,
      y1: stackedY1,
      y0: stackedY0,
      initialY1: y1,
      initialY0,
      datum,
      ...(filled && { filled }),
    };
  }
}
