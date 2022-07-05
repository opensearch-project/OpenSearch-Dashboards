/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FieldSelector } from './field_selector';

import './index.scss';
import { ConfigPanel } from './config_panel';

export const DATA_TAB_ID = 'data_tab';

export const DataTab = () => {
  return (
    <div className="wizDataTab">
      <FieldSelector />
      <ConfigPanel />
    </div>
  );
};
