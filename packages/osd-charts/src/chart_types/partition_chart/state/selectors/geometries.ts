import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { getSpecsFromStore } from '../../../../state/utils';
import { ChartTypes } from '../../..';
import { render } from './scenegraph';
import { nullShapeViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { PartitionSpec } from '../../specs/index';
import { SpecTypes } from '../../../../specs/settings';

const getSpecs = (state: GlobalChartState) => state.specs;

const getParentDimensions = (state: GlobalChartState) => state.parentDimensions;

export const partitionGeometries = createCachedSelector(
  [getSpecs, getParentDimensions],
  (specs, parentDimensions): ShapeViewModel => {
    const pieSpecs = getSpecsFromStore<PartitionSpec>(specs, ChartTypes.Partition, SpecTypes.Series);
    return pieSpecs.length === 1 ? render(pieSpecs[0], parentDimensions) : nullShapeViewModel();
  },
)((state) => state.chartId);
