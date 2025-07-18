/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IDataView } from '../../../../data/common';
import { IIndexPattern } from '../../../../data/common/index_patterns/types';

interface DataViewAdapterProps {
  dataView: IDataView;
  children: (indexPattern: IIndexPattern) => React.ReactElement;
}

export const DataViewAdapter: React.FC<DataViewAdapterProps> = ({ dataView, children }) => {
  return children(dataView as IIndexPattern);
};
