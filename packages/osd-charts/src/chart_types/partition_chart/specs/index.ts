import { ChartTypes } from '../../index';
import { config } from '../layout/config/config';
import { FunctionComponent } from 'react';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { AccessorFn, IndexedAccessorFn } from '../../../utils/accessor';
import { Spec, SpecTypes } from '../../../specs/index';
import { Config, FillLabelConfig } from '../layout/types/config_types';
import { RecursivePartial } from '../../../utils/commons';
import { Datum } from '../../../utils/domain';

type ColorAccessor = (d: Datum, index: number, array: Datum[]) => string;

export interface Layer {
  groupByRollup: IndexedAccessorFn;
  nodeLabel?: (datum: Datum) => string;
  fillLabel?: Partial<FillLabelConfig>;
  shape?: { fillColor: string | ColorAccessor };
}

const defaultProps = {
  chartType: ChartTypes.Partition,
  specType: SpecTypes.Series,
  config,
  valueAccessor: (d: Datum) => d,
  valueFormatter: (d: any): string => String(d),
  layers: [
    {
      groupByRollup: (d: Datum, i: number) => i,
      nodeLabel: (d: Datum) => d,
      fillLabel: {},
    },
  ],
};

export interface PartitionSpec extends Spec {
  specType: typeof SpecTypes.Series;
  chartType: typeof ChartTypes.Partition;
  config: RecursivePartial<Config>;
  data: Datum[];
  valueAccessor: AccessorFn;
  valueFormatter: AccessorFn;
  layers: Layer[];
}

type SpecRequiredProps = Pick<PartitionSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<PartitionSpec, 'chartType' | 'specType' | 'id' | 'data'>>;

export const Partition: FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<PartitionSpec, 'valueAccessor' | 'valueFormatter' | 'layers' | 'config'>(defaultProps),
);
