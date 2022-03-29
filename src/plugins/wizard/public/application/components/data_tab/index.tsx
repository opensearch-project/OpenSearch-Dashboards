/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FieldSelector } from './field_selector';
import { ConfigPanel } from './config_panel';

import './index.scss';

export const DataTab = () => {
  return (
    <div className="wizDataTab">
      <FieldSelector />
      <ConfigPanel />
    </div>
  );
};
