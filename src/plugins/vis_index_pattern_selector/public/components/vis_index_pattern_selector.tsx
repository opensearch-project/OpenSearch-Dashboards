/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from 'src/plugins/data/public';
import { IndexPatternManagmentContext } from 'src/plugins/index_pattern_management/public';
import React, { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ChangeIndexPattern, IndexPatternItem } from './change_indexpattern';

export interface VisIndexPatternSelectorProps {
  selectedIndexPattern: IndexPattern;
  onChange: (indexPattern: IndexPattern) => void;
}

export function VisIndexPatternSelector({
  selectedIndexPattern,
  onChange,
}: VisIndexPatternSelectorProps) {
  const { id: selectedId, title: selectedTitle } = selectedIndexPattern || {};

  // List of IndexPatterns
  const {
    data: { indexPatterns },
  } = useOpenSearchDashboards<IndexPatternManagmentContext>().services;

  const [indexPatternItems, updateIndexPatternItems] = useState<IndexPatternItem[]>([]);

  useEffect(() => {
    indexPatterns.getIdsWithTitle().then((list) => updateIndexPatternItems(list));
  }, [indexPatterns]);

  // Selected IndexPattern
  const [selected, setSelected] = useState({
    id: selectedId,
    title: selectedTitle || '',
  });

  useEffect(() => {
    if (!selectedIndexPattern) return;

    const { id, title } = selectedIndexPattern;
    setSelected({ id, title });
  }, [selectedIndexPattern]);

  // Handle IndexPattern change
  const onChangeCallback = useCallback(
    async (id: string) => {
      onChange(await indexPatterns.get(id));
    },
    [onChange, indexPatterns]
  );

  if (!selectedId) {
    return null;
  }

  return (
    <div className="visIndexPatternSelector__container">
      <I18nProvider>
        <ChangeIndexPattern
          trigger={{
            label: selected.title,
            title: selected.title,
            'data-test-subj': 'indexPatternSelector-switch-link',
            className: 'visIndexPatternSelector__triggerButton',
          }}
          indexPatternId={selected.id}
          indexPatternItems={indexPatternItems}
          onChange={onChangeCallback}
        />
      </I18nProvider>
    </div>
  );
}
