import { DataSeries, DataSeriesDatum, RawDataSeries } from './series';

/**
 * Map each y value from a RawDataSeries on it's specific x value into,
 * ordering the stack based on the dataseries index.
 * @param dataseries
 */
export function getYValueStackMap(dataseries: RawDataSeries[]): Map<any, number[]> {
  const stackMap = new Map<any, number[]>();
  dataseries.forEach((ds, index) => {
    ds.data.forEach((datum) => {
      const stack = stackMap.get(datum.x) || new Array(dataseries.length).fill(0);
      stack[index] = datum.y1;
      stackMap.set(datum.x, stack);
    });
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
): Map<any, number[]> {
  const stackedValues = new Map<any, number[]>();

  yValueStackMap.forEach((yStackArray, xValue) => {
    const stackArray = yStackArray.reduce(
      (stackedValue, currentValue, index) => {
        if (stackedValue.length === 0) {
          if (scaleToExtent) {
            return [currentValue, currentValue];
          }
          return [0, currentValue];
        }
        return [...stackedValue, stackedValue[index] + currentValue];
      },
      [] as number[],
    );
    stackedValues.set(xValue, stackArray);
  });
  return stackedValues;
}

export function formatStackedDataSeriesValues(
  dataseries: RawDataSeries[],
  scaleToExtent: boolean,
): DataSeries[] {
  const yValueStackMap = getYValueStackMap(dataseries);

  const stackedValues = computeYStackedMapValues(yValueStackMap, scaleToExtent);

  const stackedDataSeries: DataSeries[] = dataseries.map((ds, seriesIndex) => {
    const newData: DataSeriesDatum[] = [];
    ds.data.forEach((data) => {
      const { x, y1, datum } = data;
      if (stackedValues.get(x) === undefined) {
        return;
      }
      let computedY0: number | null;
      if (scaleToExtent) {
        computedY0 = data.y0 ? data.y0 : y1;
      } else {
        computedY0 = data.y0 ? data.y0 : 0;
      }
      const initialY0 = data.y0 == null ? null : data.y0;
      if (seriesIndex === 0) {
        newData.push({
          x,
          y1,
          y0: computedY0,
          initialY1: y1,
          initialY0,
          datum,
        });
      } else {
        const stack = stackedValues.get(x);
        if (!stack) {
          return;
        }
        const stackY = stack[seriesIndex];
        const stackedY1 = y1 !== null ? stackY + y1 : null;
        let stackedY0: number | null = data.y0 == null ? stackY : stackY + data.y0;
        // configure null y0 if y1 is null
        // it's semantically right to say y0 is null if y1 is null
        if (stackedY1 === null) {
          stackedY0 = null;
        }
        newData.push({
          x,
          y1: stackedY1,
          y0: stackedY0,
          initialY1: y1,
          initialY0,
          datum,
        });
      }
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
