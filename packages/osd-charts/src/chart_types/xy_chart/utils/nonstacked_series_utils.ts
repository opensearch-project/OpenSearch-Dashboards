import { DataSeries, DataSeriesDatum, RawDataSeries } from './series';
import { fitFunction } from './fit_function';
import { isAreaSeriesSpec, isLineSeriesSpec, SeriesSpecs } from './specs';
import { ScaleType } from '../../../utils/scales/scales';

export const formatNonStackedDataSeriesValues = (
  dataseries: RawDataSeries[],
  scaleToExtent: boolean,
  seriesSpecs: SeriesSpecs,
  xScaleType: ScaleType,
): DataSeries[] => {
  const len = dataseries.length;
  const formattedValues: DataSeries[] = [];
  for (let i = 0; i < len; i++) {
    const formattedDataValue = formatNonStackedDataValues(dataseries[i], scaleToExtent);
    const spec = seriesSpecs.get(formattedDataValue.specId);

    if (
      spec !== null &&
      spec !== undefined &&
      (isAreaSeriesSpec(spec) || isLineSeriesSpec(spec)) &&
      spec.fit !== undefined
    ) {
      const fittedData = fitFunction(formattedDataValue, spec.fit, xScaleType);
      formattedValues.push(fittedData);
    } else {
      formattedValues.push(formattedDataValue);
    }
  }
  return formattedValues;
};

export const formatNonStackedDataValues = (dataSeries: RawDataSeries, scaleToExtent: boolean): DataSeries => {
  const len = dataSeries.data.length;
  const formattedValues: DataSeries = {
    key: dataSeries.key,
    specId: dataSeries.specId,
    seriesColorKey: dataSeries.seriesColorKey,
    data: [],
  };
  for (let i = 0; i < len; i++) {
    const data = dataSeries.data[i];
    const { x, y1, datum } = data;
    let y0: number | null;
    if (y1 === null) {
      y0 = null;
    } else {
      if (scaleToExtent) {
        y0 = data.y0 ? data.y0 : y1;
      } else {
        y0 = data.y0 ? data.y0 : 0;
      }
    }

    const formattedValue: DataSeriesDatum = {
      x,
      y1,
      y0,
      initialY1: y1,
      initialY0: data.y0 == null || y1 === null ? null : data.y0,
      datum,
    };
    formattedValues.data.push(formattedValue);
  }
  return formattedValues;
};
