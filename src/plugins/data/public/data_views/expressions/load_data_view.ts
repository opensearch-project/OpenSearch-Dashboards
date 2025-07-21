/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition } from '../../../../expressions/public';
import { getDataViews } from '../../services';
import { DataViewSpec } from '../../../common/data_views';

const name = 'dataViewLoad';

type Input = null;
type Output = Promise<{ type: 'data_view'; value: DataViewSpec }>;

interface Arguments {
  id: string;
}

export const dataViewLoad = (): ExpressionFunctionDefinition<
  typeof name,
  Input,
  Arguments,
  Output
> => ({
  name,
  type: 'data_view',
  inputTypes: ['null'],
  help: i18n.translate('data.functions.dataViewLoad.help', {
    defaultMessage: 'Loads an index pattern',
  }),
  args: {
    id: {
      types: ['string'],
      required: true,
      help: i18n.translate('data.functions.dataViewLoad.id.help', {
        defaultMessage: 'index pattern id to load',
      }),
    },
  },
  async fn(input, args) {
    const dataViews = getDataViews();

    const dataView = await dataViews.get(args.id);

    return { type: 'data_view', value: dataView.toSpec() };
  },
});
