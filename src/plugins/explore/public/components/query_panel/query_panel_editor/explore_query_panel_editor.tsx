/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryPanelEditor } from './query_panel_editor';
import { useQueryPanelEditorProps } from './use_query_panel_editor/use_query_panel_editor_props';

export const ExploreQueryPanelEditor = () => {
  const props = useQueryPanelEditorProps();
  return <QueryPanelEditor {...props} />;
};
