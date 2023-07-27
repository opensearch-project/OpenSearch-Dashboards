/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from '../../utils/state_management';

export const Panel = () => {
  const interval = useSelector((state) => state.discover.interval);
  return <div>{interval}</div>;
};
