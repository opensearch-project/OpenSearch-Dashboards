/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryPanelEditor as InnerQueryEditor } from '../../../components/query_panel/';
import { useQueryPanelEditorProps } from '../hooks/use_query_panel_editor_props';
import './query_editor.scss';

export const QueryPanelEditor = () => {
  const { editorKey, ...props } = useQueryPanelEditorProps();

  return (
    <div className="exploreVisEditorAutoGrowEditor">
      <InnerQueryEditor key={editorKey} {...props} />
    </div>
  );
};
