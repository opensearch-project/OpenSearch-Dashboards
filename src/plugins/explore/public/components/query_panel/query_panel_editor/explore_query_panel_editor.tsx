/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryPanelEditor } from './query_panel_editor';
import { useQueryPanelEditorProps } from './use_query_panel_editor/use_query_panel_editor_props';

interface ExploreQueryPanelEditorProps {
  readOnly?: boolean;
  readOnlyTooltip?: string;
}

export const ExploreQueryPanelEditor = ({
  readOnly,
  readOnlyTooltip,
}: ExploreQueryPanelEditorProps) => {
  const props = useQueryPanelEditorProps();
  return <QueryPanelEditor {...props} readOnly={readOnly} readOnlyTooltip={readOnlyTooltip} />;
};
