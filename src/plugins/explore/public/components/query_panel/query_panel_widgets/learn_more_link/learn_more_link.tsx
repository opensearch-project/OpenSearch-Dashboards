/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import {
  selectIsPromptEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { getServices } from '../../../../services/services';

export const LearnMoreLink = () => {
  const queryLanguage = useSelector(selectQueryLanguage);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const { data, docLinks } = getServices();
  const langConfig = data.query.queryString.getLanguageService().getLanguage(queryLanguage);

  // In prompt mode no language chip is selected, so naming one points at an inactive chip.
  // TODO link prompt mode once AI querying has docs. Needs a url and a second label, since
  // `learnMoreLabel` interpolates a language.
  if (isPromptMode) {
    return null;
  }

  // PPL and SQL go through core because it interpolates `DOC_LINK_VERSION` where the urls
  // they register hardcode `latest`. That leaves `docLink` uneven for now, editing PromQL's
  // registration moves this link and editing PPL's does not. The `base` tail matters because
  // EuiLink renders a disabled button with no `href`.
  const { sqlPplIndex } = docLinks.links.noDocumentation;
  const url =
    (queryLanguage === 'SQL'
      ? sqlPplIndex.sql
      : queryLanguage === 'PPL'
        ? sqlPplIndex.ppl
        : undefined) ??
    langConfig?.docLink?.url ??
    sqlPplIndex.base;

  // `title` not the raw id, so the label matches the chip above it.
  const label = i18n.translate('explore.queryPanel.learnMoreLabel', {
    defaultMessage: 'Learn more about {language}',
    values: { language: langConfig?.title ?? queryLanguage },
  });

  return (
    <EuiLink
      className="exploreLanguagePicker__learnMore"
      href={url}
      // EuiLink adds the popout icon and screen-reader text for `_blank` itself.
      target="_blank"
      data-test-subj="exploreQueryPanelLearnMore"
    >
      {label}
    </EuiLink>
  );
};
