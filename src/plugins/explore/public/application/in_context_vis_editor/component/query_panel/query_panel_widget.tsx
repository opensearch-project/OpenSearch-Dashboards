/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageToggle } from './lauguage_toggle';

import { DatasetSelectWidget } from './dataset_select';
import '../../visualization_editor.scss';
import { SaveQueryButton } from './save_query_button';

export const QueryPanelWidgets = () => {
  return (
    <div className="exploreQueryPanelWidgets">
      {/* Left Section */}
      <div className="exploreQueryPanelWidgets__left">
        <LanguageToggle />
        <DatasetSelectWidget />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        <SaveQueryButton />
      </div>
    </div>
  );
};
