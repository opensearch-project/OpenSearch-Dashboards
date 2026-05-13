/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageToggle } from './lauguage_toggle';

import { DatasetSelectWidget } from './dataset_select';
import '../../visualization_editor.scss';
import { SaveQueryButton } from './save_query_button';
import { useQueryPanelContext } from './query_panel_context';

export const QueryPanelWidgets = () => {
  const { showDatasetSelect, showLanguageToggle, showSaveQueryButton } = useQueryPanelContext();
  return (
    <div className="exploreQueryPanelWidgets">
      {/* Left Section */}
      <div className="exploreQueryPanelWidgets__left">
        {showLanguageToggle && <LanguageToggle />}
        {showDatasetSelect && <DatasetSelectWidget />}
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        {showSaveQueryButton && <SaveQueryButton />}
      </div>
    </div>
  );
};
