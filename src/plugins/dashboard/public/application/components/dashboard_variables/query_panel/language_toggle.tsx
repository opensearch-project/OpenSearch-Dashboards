/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiContextMenuItem, EuiPopover, EuiBetaBadge, EuiContextMenuPanel } from '@elastic/eui';
import React, { useState, useCallback, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../../types';
import './variable_query_panel.scss';

export const LanguageToggle: React.FC<{
  language: string;
  onLanguageChange: (lang: string) => void;
}> = ({ language, onLanguageChange }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { services } = useOpenSearchDashboards<DashboardServices>();

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const languageTitle = useMemo(() => {
    const languageService = services.data.query.queryString.getLanguageService();
    return languageService.getLanguage(language)?.title ?? language;
  }, [language, services.data.query.queryString]);

  const onItemClick = useCallback(
    (lang: string) => {
      closePopover();
      onLanguageChange(lang);
    },
    [closePopover, onLanguageChange]
  );

  const items = useMemo(() => {
    const languageService = services.data.query.queryString.getLanguageService();
    const languages = languageService.getLanguages();

    return languages
      .filter((lang: any) => lang.id === 'PPL' || lang.id === 'PROMQL')
      .map((lang: any) => (
        <EuiContextMenuItem
          key={lang.id}
          onClick={() => onItemClick(lang.id)}
          disabled={lang.id === language}
          data-test-subj={`variableQueryPanelLanguageToggle-${lang.title}`}
        >
          {lang.title}
        </EuiContextMenuItem>
      ));
  }, [language, onItemClick, services.data.query.queryString]);

  return (
    <div className="variableLanguageToggle">
      <EuiPopover
        button={
          <EuiBetaBadge
            onClick={onButtonClick}
            data-test-subj="variableQueryPanelLanguageToggle"
            className="variableLanguageToggle__button"
            label={languageTitle}
          />
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
        panelPaddingSize="none"
      >
        <EuiContextMenuPanel size="s" items={items} />
      </EuiPopover>
    </div>
  );
};
