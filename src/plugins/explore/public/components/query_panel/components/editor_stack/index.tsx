/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';

const EditorStack = () => {
  return (
    <>
      <PromptEditor />
      <QueryEditor />
    </>
  );
};

export { EditorStack };
