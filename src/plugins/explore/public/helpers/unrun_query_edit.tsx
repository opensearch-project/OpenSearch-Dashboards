/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiCode, EuiText } from '@elastic/eui';

/** The query a save stores and the edited text in the editor that it doesn't store. */
export interface UnrunQueryEdit {
  savedQuery: string;
  editorQuery: string;
}

/**
 * A save stores the query that last ran, not the editor's text. Returns both when they differ
 * (whitespace at either end aside), so the save can say the edits won't be saved; undefined when
 * the editor has no unrun edits or its text isn't known (no editor, or the editor holds a prompt).
 */
export const getUnrunQueryEdit = (
  savedQuery: string | undefined,
  editorQuery: string | undefined
): UnrunQueryEdit | undefined => {
  if (editorQuery === undefined) return undefined;
  const saved = savedQuery ?? '';
  if (editorQuery.trim() === saved.trim()) return undefined;
  return { savedQuery: saved, editorQuery };
};

const PREVIEW_LENGTH = 200;

const preview = (query: string) => {
  const text = query.trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
};

const emptyQueryText = i18n.translate('explore.unrunQueryEdit.emptyQuery', {
  defaultMessage: '(empty)',
});

/**
 * What a save of the last-run query stores, and that the editor's unrun edits aren't part of it,
 * with both queries.
 */
export const UnrunQueryEditDetails = ({
  edit,
  objectType,
}: {
  edit: UnrunQueryEdit;
  objectType: 'search' | 'visualization';
}) => (
  <EuiText size="s">
    <p>
      {objectType === 'search'
        ? i18n.translate('explore.unrunQueryEdit.searchDescription', {
            defaultMessage:
              'The search is saved with the last query that ran. Your edits stay in the editor. To save them, run the query, then save again.',
          })
        : i18n.translate('explore.unrunQueryEdit.visualizationDescription', {
            defaultMessage:
              'The visualization is saved with the last query that ran. To save your edits, run the query first.',
          })}
    </p>
    <p>
      {i18n.translate('explore.unrunQueryEdit.savedQueryLabel', {
        defaultMessage: 'Saved query:',
      })}{' '}
      <EuiCode data-test-subj="unrunQueryEditSavedQuery">
        {preview(edit.savedQuery) || emptyQueryText}
      </EuiCode>
    </p>
    <p>
      {i18n.translate('explore.unrunQueryEdit.editorQueryLabel', {
        defaultMessage: 'In the editor, not run:',
      })}{' '}
      <EuiCode data-test-subj="unrunQueryEditEditorQuery">
        {preview(edit.editorQuery) || emptyQueryText}
      </EuiCode>
    </p>
  </EuiText>
);

export const unrunQueryEditTitle = i18n.translate('explore.unrunQueryEdit.title', {
  defaultMessage: "Your query edits haven't been run and won't be saved",
});

/** The same, as a warning in a save dialog; the save goes ahead when the user confirms it. */
export const UnrunQueryEditCallout = ({
  edit,
  objectType,
}: {
  edit: UnrunQueryEdit;
  objectType: 'search' | 'visualization';
}) => (
  <EuiCallOut
    title={unrunQueryEditTitle}
    color="warning"
    iconType="alert"
    size="s"
    data-test-subj="unrunQueryEditCallout"
  >
    <UnrunQueryEditDetails edit={edit} objectType={objectType} />
  </EuiCallOut>
);
