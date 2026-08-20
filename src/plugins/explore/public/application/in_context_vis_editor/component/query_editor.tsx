/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryPanelEditor as InnerQueryEditor } from '../../../components/query_panel/';
import { useQueryPanelEditorProps } from '../hooks/use_query_panel_editor_props';

export const QueryPanelEditor = () => {
  const props = useQueryPanelEditorProps();

  return <InnerQueryEditor {...props} />;
};
