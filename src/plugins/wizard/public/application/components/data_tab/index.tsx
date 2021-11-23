/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndexPatternField } from '../../../../../data/public';
import { FieldSelector } from './field_selector';
import { ConfigPanel } from './config_panel';

import './index.scss';

interface DataTabDeps {
  indexFields: IndexPatternField[];
}

export const DataTab = ({ indexFields }: DataTabDeps) => {
  return (
    <div className="wizDataTab">
      <FieldSelector indexFields={indexFields} />
      <ConfigPanel />
    </div>
  );
};
