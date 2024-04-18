/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

import { PanelSchema } from 'src/plugins/vis_type_timeseries/common/types';
import { DATA_SOURCE_ID_KEY } from '../../../../common/constants';

export const createDataSourcePickerHandler = (handleChange: (e: PanelSchema) => void) => {
  return (selectedOptions: []): void => {
    return handleChange?.({
      [DATA_SOURCE_ID_KEY]: _.get(selectedOptions, '[0].id', undefined),
    } as PanelSchema);
  };
};
