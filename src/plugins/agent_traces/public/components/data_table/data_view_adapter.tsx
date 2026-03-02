/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IDataView, IIndexPattern } from '../../../../data/common';

interface DataViewAdapterProps {
  dataView: IDataView;
  children: (indexPattern: IIndexPattern) => React.ReactElement;
}

export const DataViewAdapter: React.FC<DataViewAdapterProps> = ({ dataView, children }) => {
  return children(dataView as IIndexPattern);
};
