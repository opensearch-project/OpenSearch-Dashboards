import { ChartTypes } from '../../index';
import { config } from '../layout/config/config';
import { FunctionComponent } from 'react';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { IndexedAccessorFn } from '../../../utils/accessor';
import { Spec, SpecTypes } from '../../../specs/index';
import { Config, FillLabelConfig } from '../layout/types/config_types';
import { Datum, LabelAccessor, RecursivePartial, ValueAccessor, ValueFormatter } from '../../../utils/commons';
import { NodeColorAccessor } from '../layout/types/viewmodel_types';
import { PrimitiveValue } from '../layout/utils/group_by_rollup';

export interface Layer {
  groupByRollup: IndexedAccessorFn;
  nodeLabel?: LabelAccessor;
  fillLabel?: Partial<FillLabelConfig>;
  shape?: { fillColor: string | NodeColorAccessor };
}

const defaultProps = {
  chartType: ChartTypes.Partition,
  specType: SpecTypes.Series,
  config,
  valueAccessor: (d: Datum) => (typeof d === 'number' ? d : 0),
  valueFormatter: (d: number): string => String(d),
  layers: [
    {
      groupByRollup: (d: Datum, i: number) => i,
      nodeLabel: (d: PrimitiveValue) => String(d),
      fillLabel: {},
    },
  ],
};

export interface PartitionSpec extends Spec {
  specType: typeof SpecTypes.Series;
  chartType: typeof ChartTypes.Partition;
  config: RecursivePartial<Config>;
  data: Datum[];
  valueAccessor: ValueAccessor;
  valueFormatter: ValueFormatter;
  layers: Layer[];
}

type SpecRequiredProps = Pick<PartitionSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<PartitionSpec, 'chartType' | 'specType' | 'id' | 'data'>>;

export const Partition: FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<PartitionSpec, 'valueAccessor' | 'valueFormatter' | 'layers' | 'config'>(defaultProps),
);
