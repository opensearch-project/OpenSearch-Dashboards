/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition } from '../../../../expressions/public';
import { getDatasets } from '../../services';
import { DatasetSpec } from '../../../common/datasets';

const name = 'datasetLoad';

type Input = null;
type Output = Promise<{ type: 'dataset'; value: DatasetSpec }>;

interface Arguments {
  id: string;
}

export const datasetLoad = (): ExpressionFunctionDefinition<
  typeof name,
  Input,
  Arguments,
  Output
> => ({
  name,
  type: 'dataset',
  inputTypes: ['null'],
  help: i18n.translate('data.functions.datasetLoad.help', {
    defaultMessage: 'Loads an dataset',
  }),
  args: {
    id: {
      types: ['string'],
      required: true,
      help: i18n.translate('data.functions.datasetLoad.id.help', {
        defaultMessage: 'dataset id to load',
      }),
    },
  },
  async fn(input, args) {
    const datasets = getDatasets();

    const dataset = await datasets.get(args.id);

    return { type: 'dataset', value: dataset.toSpec() };
  },
});
