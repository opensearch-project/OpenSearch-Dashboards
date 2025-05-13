/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';
import { QueryEditorFooter } from './components/footer/index';
const QueryPanel = () => {
  return (
    <QueryPanelLayout footer={<QueryEditorFooter />}>
      <EditorStack />
    </QueryPanelLayout>
  );
};

export { QueryPanel };
