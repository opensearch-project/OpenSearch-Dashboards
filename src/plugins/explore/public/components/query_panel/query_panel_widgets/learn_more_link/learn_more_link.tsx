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

const DOCS_HOST = 'https://docs.opensearch.org';

// These override each language's own registered `docLink`, which points at an older deep
// link. Null prototype because `queryLanguage` is unvalidated URL state, and against a
// plain literal an inherited key such as `constructor` resolves to a function, which `??`
// will not catch. Passed raw to `href` that threw `url.match is not a function`. Once
// interpolated as it is below it stops throwing and silently builds a nonsense url, so the
// null prototype is what actually keeps the fallback reachable.
const LANGUAGE_DOC_PATHS: Record<string, string> = Object.assign(Object.create(null), {
  PPL: 'sql-and-ppl/ppl/index/',
  SQL: 'sql-and-ppl/sql/index/',
});

// Covers a language id matching nothing registered, which restored URL state or a saved
// query can carry. Without it EuiLink renders a disabled button rather than an anchor.
const DEFAULT_DOC_PATH = 'sql-and-ppl/';

export const LearnMoreLink = () => {
  const queryLanguage = useSelector(selectQueryLanguage);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const { data, docLinks } = getServices();
  const langConfig = data.query.queryString.getLanguageService().getLanguage(queryLanguage);

  // In prompt mode no language chip is selected, but `queryLanguage` still holds the one
  // the editor will return to, so naming it would point at a visibly unselected chip.
  // TODO link prompt mode once AI querying has documentation. That needs two changes, a
  // url and a second label, since `learnMoreLabel` interpolates a language and would
  // otherwise read "Learn more about PPL" over a link to the AI docs.
  if (isPromptMode) {
    return null;
  }

  const docsRoot = `${DOCS_HOST}/${docLinks.DOC_LINK_VERSION}`;
  const languagePath = LANGUAGE_DOC_PATHS[queryLanguage];
  const url = languagePath
    ? `${docsRoot}/${languagePath}`
    : (langConfig?.docLink?.url ?? `${docsRoot}/${DEFAULT_DOC_PATH}`);

  // `title` rather than the raw id, so the label cannot disagree with the selected chip
  // above it, which labels itself the same way.
  const label = i18n.translate('explore.queryPanel.learnMoreLabel', {
    defaultMessage: 'Learn more about {language}',
    values: { language: langConfig?.title ?? queryLanguage },
  });

  return (
    <EuiLink
      className="exploreLanguagePicker__learnMore"
      href={url}
      // EuiLink appends the popout icon and a screen-reader "opens in a new tab" for
      // `_blank` on its own, so neither is passed explicitly.
      target="_blank"
      data-test-subj="exploreQueryPanelLearnMore"
    >
      {label}
    </EuiLink>
  );
};
