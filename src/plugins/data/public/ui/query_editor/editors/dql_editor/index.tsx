/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface DQLBodyProps extends React.JSX.IntrinsicAttributes {
  filterBar?: any;
}

export const DQLBody: React.FC<DQLBodyProps> = ({ filterBar }) => <div>{filterBar}</div>;
