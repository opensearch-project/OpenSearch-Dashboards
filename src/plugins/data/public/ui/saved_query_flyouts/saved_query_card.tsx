/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButtonIcon,
  EuiCheckableCard,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useRef, useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
import { SavedQuery } from '../../query';
import { DeleteSavedQueryConfirmationModal } from '../saved_query_management/delete_saved_query_confirmation_modal';

export interface SavedQueryCardProps {
  savedQuery: SavedQuery;
  selectedQuery?: SavedQuery;
  onSelect: (query: SavedQuery) => void;
  handleQueryDelete: (query: SavedQuery) => void;
}

export function SavedQueryCard({
  savedQuery,
  selectedQuery,
  onSelect,
  handleQueryDelete,
}: SavedQueryCardProps) {
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const [isTruncated, setIsTruncated] = useState(true);
  const [editorHeight, setEditorHeight] = useState(60);
  const customHTMLRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [showDeletionConfirmationModal, setShowDeletionConfirmationModal] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const toggleView = () => {
    setIsTruncated(!isTruncated);
  };

  useEffect(() => {
    if (!shouldTruncate) {
      return;
    }

    if (isTruncated) {
      setEditorHeight(80);
      return;
    }

    const editor = customHTMLRef.current;
    if (!editor) {
      return;
    }

    const editorElement = editor.getDomNode();

    if (!editorElement) {
      return;
    }

    const height = editor.getScrollHeight();
    setEditorHeight(height);
  }, [isTruncated, shouldTruncate]);

  function handleHTMLEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
    const scrollHeight = editor.getScrollHeight();
    setEditorHeight(scrollHeight);

    if (scrollHeight > 80) {
      setShouldTruncate(true);
    }

    setLineCount(editor.getModel()?.getLineCount() || 0);
    customHTMLRef.current = editor;
  }

  return (
    <>
      <EuiCheckableCard
        id={savedQuery.id}
        value={savedQuery.id}
        checked={selectedQuery?.id === savedQuery.id}
        onChange={() => {
          onSelect(savedQuery);
        }}
        label={
          <>
            <EuiFlexGroup alignItems="center" gutterSize="xs">
              <EuiFlexItem>
                <EuiFlexGroup alignItems="center" gutterSize="s">
                  <EuiFlexItem grow={false}>
                    <EuiTitle size="s">
                      <h4>{savedQuery.attributes.title}</h4>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge>{savedQuery.attributes.query.language}</EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              {!savedQuery.attributes.isTemplate && (
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="trash"
                    color="danger"
                    data-test-subj="deleteSavedQueryButton"
                    onClick={() => {
                      setShowDeletionConfirmationModal(true);
                    }}
                  />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
            {savedQuery.attributes.description && (
              <EuiText size="s">
                <p>{savedQuery.attributes.description}</p>
              </EuiText>
            )}
            {savedQuery.attributes.query.dataset?.title && (
              <EuiText color="subdued" size="s">
                <p>{savedQuery.attributes.query.dataset.title}</p>
              </EuiText>
            )}
          </>
        }
      >
        <EuiFlexGroup gutterSize="s" alignItems="flexStart">
          <EuiFlexItem>
            <div className="editor-container" data-test-subj="editorContainer">
              <MonacoEditor
                height={editorHeight}
                language={savedQuery.attributes.query.language} // Change to the appropriate language
                value={savedQuery.attributes.query.query as string}
                options={{
                  readOnly: true, // Set to true to prevent editing,
                  minimap: { showSlider: 'mouseover', enabled: false },
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                editorDidMount={handleHTMLEditorDidMount}
              />
              {shouldTruncate && (
                <div className={isTruncated ? 'read-more-wrap' : ''}>
                  <EuiLink
                    className="read-more-btn"
                    onClick={toggleView}
                    data-test-subj="readMoreButton"
                  >
                    {i18n.translate('data.saved_query.view_more_label', {
                      defaultMessage: '{viewMoreLabel}',
                      values: {
                        viewMoreLabel: `${
                          isTruncated ? `View full query (${lineCount} lines)` : 'View Less'
                        }`,
                      },
                    })}
                  </EuiLink>
                </div>
              )}
            </div>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 0 }}>
            <EuiCopy textToCopy={savedQuery.attributes.query.query as string}>
              {(copy) => (
                <EuiButtonIcon
                  onClick={copy}
                  iconType="copy"
                  iconSize="m"
                  aria-label={i18n.translate('data.saved_query.copy_query_aria_label', {
                    defaultMessage: 'Copy recent query',
                  })}
                />
              )}
            </EuiCopy>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiCheckableCard>
      <EuiSpacer size="s" />
      {showDeletionConfirmationModal && (
        <DeleteSavedQueryConfirmationModal
          savedQuery={savedQuery}
          onConfirm={() => {
            handleQueryDelete(savedQuery);
            setShowDeletionConfirmationModal(false);
          }}
          onCancel={() => {
            setShowDeletionConfirmationModal(false);
          }}
        />
      )}
    </>
  );
}
