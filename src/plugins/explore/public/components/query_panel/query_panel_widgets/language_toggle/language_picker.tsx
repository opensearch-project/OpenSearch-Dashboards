/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  EuiIcon,
  EuiPopover,
  IconType,
  PopoverAnchorPosition,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import './language_toggle.scss';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'AI',
});

const sourceTypeSectionTitle = i18n.translate(
  'explore.queryPanelFooter.languageToggle.sourceTypeSectionTitle',
  {
    defaultMessage: 'Source type',
  }
);

const openPickerAriaLabel = i18n.translate('explore.queryPanelFooter.languageToggle.ariaLabel', {
  defaultMessage: 'Select source type and query language',
});

export interface LanguagePickerLanguage {
  id: string;
  /** The name shown, already resolved for the active source. */
  label: string;
  /** Ends the language's test subjects (`queryPanelFooterLanguageToggle-<suffix>`, …). */
  testSubjSuffix: string;
  guide?: { tag?: string; description?: string };
}

export interface LanguagePickerSourceType {
  id: string;
  label: string;
  /** Ends the source's test subject (`queryPanelFooterSourceType-<suffix>`). */
  testSubjSuffix: string;
}

export interface LanguagePickerProps {
  triggerIcon: IconType;
  /** The current language's name; the picker shows "AI" instead in prompt mode. */
  languageLabel: string;
  isPromptMode: boolean;

  /** One entry renders as the selected, non-interactive source; none hides the column. */
  sourceTypes: LanguagePickerSourceType[];
  activeSourceTypeId?: string;
  onSelectSourceType?: (sourceTypeId: string) => void;

  queryLanguageTitle: string;
  /** The languages to offer, already narrowed by the caller to what the active dataset can run. */
  languages: LanguagePickerLanguage[];
  selectedLanguage?: string;
  /** Picks another language. */
  onSelectLanguage: (languageId: string) => void;
  /** Picks the current language while in prompt mode: back to query mode. */
  onSelectQueryMode: () => void;

  showAI: boolean;
  onSelectPromptMode: () => void;

  /** Below the languages (e.g. a "Learn more" link). */
  footer?: ReactNode;
  anchorPosition?: PopoverAnchorPosition;
}

export const LanguagePicker = ({
  triggerIcon,
  languageLabel,
  isPromptMode,
  sourceTypes,
  activeSourceTypeId,
  onSelectSourceType,
  queryLanguageTitle,
  languages,
  selectedLanguage,
  onSelectLanguage,
  onSelectQueryMode,
  showAI,
  onSelectPromptMode,
  footer,
  anchorPosition = 'downLeft',
}: LanguagePickerProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  // A source that describes its languages (so e.g. OpenSearch SQL and another source's SQL read
  // differently) gets them as a list of rows, each with its name, tag and description, so they can
  // be compared before picking one. Otherwise they stay compact chips.
  const describesLanguages = languages.some(({ guide }) => !!guide?.description || !!guide?.tag);

  // The two columns are labelled groups, so the section headings are announced
  // as the group name rather than as loose text before the controls.
  const sourceTypeTitleId = useMemo(() => htmlIdGenerator('exploreLanguagePickerSourceType')(), []);
  const queryLanguageTitleId = useMemo(
    () => htmlIdGenerator('exploreLanguagePickerQueryLanguage')(),
    []
  );

  // A chip is selected exactly when it is the mode the editor is already in.
  // Selection is announced with `aria-current` rather than by disabling the
  // chip: a disabled button is announced as unavailable rather than as the
  // current choice, and drops out of the tab order. Clicking the selected chip
  // remains a no-op, as it was when the chip was disabled.
  const languageChips = languages.map(({ id, label, testSubjSuffix, guide }) => {
    const isSelected = !isPromptMode && id === selectedLanguage;
    return (
      <button
        type="button"
        key={id}
        onClick={() => {
          if (isSelected) return;
          closePopover();
          // Same language, but the editor is in prompt mode: go back to query mode.
          if (id === selectedLanguage) {
            onSelectQueryMode();
          } else {
            onSelectLanguage(id);
          }
        }}
        aria-current={isSelected ? 'true' : undefined}
        className={classNames(
          describesLanguages ? 'exploreLanguagePicker__language' : 'exploreLanguagePicker__chip',
          {
            ['exploreLanguagePicker__language--selected']: describesLanguages && isSelected,
            ['exploreLanguagePicker__chip--selected']: !describesLanguages && isSelected,
          }
        )}
        data-test-subj={`queryPanelFooterLanguageToggle-${testSubjSuffix}`}
      >
        {describesLanguages ? (
          <>
            <span className="exploreLanguagePicker__languageHeader">
              <span className="exploreLanguagePicker__languageName">{label}</span>
              {guide?.tag && (
                <span
                  className="exploreLanguagePicker__languageTag"
                  data-test-subj={`queryPanelFooterLanguageTag-${testSubjSuffix}`}
                >
                  {guide.tag}
                </span>
              )}
            </span>
            {guide?.description && (
              <span
                className="exploreLanguagePicker__languageDescription"
                data-test-subj={`queryPanelFooterLanguageRowDescription-${testSubjSuffix}`}
              >
                {guide.description}
              </span>
            )}
          </>
        ) : (
          label
        )}
      </button>
    );
  });

  const aiChip = showAI ? (
    <button
      type="button"
      onClick={() => {
        if (isPromptMode) return;
        closePopover();
        onSelectPromptMode();
      }}
      aria-current={isPromptMode ? 'true' : undefined}
      className={classNames('exploreLanguagePicker__chip', 'exploreLanguagePicker__chip--ai', {
        ['exploreLanguagePicker__chip--selected']: isPromptMode,
      })}
      data-test-subj="queryPanelFooterLanguageToggle-AI"
    >
      {promptOptionText}
    </button>
  ) : null;

  return (
    // This div is needed to allow for the gradient styling
    <div className="exploreLanguagePicker">
      <EuiPopover
        button={
          <button
            type="button"
            onClick={() => setIsPopoverOpen((open) => !open)}
            // A disclosure button: `aria-expanded` alone. `aria-haspopup` is
            // deliberately absent — its `true` value means "menu", and the panel
            // is a labelled group of buttons, not a menu with roving focus.
            aria-expanded={isPopoverOpen}
            aria-label={openPickerAriaLabel}
            data-test-subj="queryPanelFooterLanguageToggle"
            className={classNames('exploreLanguagePicker__trigger', {
              ['exploreLanguagePicker__trigger--aiMode']: isPromptMode,
              // Keep the hover outline while the popover is open, so moving the
              // pointer off the button and into the panel does not drop it.
              ['exploreLanguagePicker__trigger--open']: isPopoverOpen,
            })}
          >
            <EuiIcon type={triggerIcon} size="m" data-test-subj="queryPanelFooterSourceTypeIcon" />
            <span className="exploreLanguagePicker__triggerLabel">
              {isPromptMode ? promptOptionText : languageLabel}
            </span>
            <EuiIcon type="arrowDown" size="s" className="exploreLanguagePicker__triggerCaret" />
          </button>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition={anchorPosition}
        panelPaddingSize="none"
        hasArrow={false}
        // Without an arrow OuiPopover drops to an 8px gap, most of which the
        // open trigger's 3px halo eats, so the panel reads as touching the
        // pill. The extra 4px lands its top edge at the query editor below.
        offset={4}
        // Focus stays on the trigger. With the default focus trap the popover
        // focuses the first focusable child on open, so a chip the user did not
        // pick came up looking pre-highlighted. This branch of OuiPopover still
        // closes on Escape and on an outside click.
        ownFocus={false}
      >
        <div className="exploreLanguagePicker__panel">
          {sourceTypes.length > 0 && (
            <div
              className="exploreLanguagePicker__section exploreLanguagePicker__section--sourceType"
              role="group"
              aria-labelledby={sourceTypeTitleId}
            >
              <div className="exploreLanguagePicker__sectionTitle" id={sourceTypeTitleId}>
                {sourceTypeSectionTitle}
              </div>
              {sourceTypes.length > 1 ? (
                sourceTypes.map((sourceType) => {
                  const isSelected = sourceType.id === activeSourceTypeId;
                  return (
                    <button
                      type="button"
                      key={sourceType.id}
                      onClick={() => {
                        if (isSelected) return;
                        closePopover();
                        onSelectSourceType?.(sourceType.id);
                      }}
                      aria-current={isSelected ? 'true' : undefined}
                      className={classNames('exploreLanguagePicker__sourceType', {
                        ['exploreLanguagePicker__sourceType--selected']: isSelected,
                      })}
                      data-test-subj={`queryPanelFooterSourceType-${sourceType.testSubjSuffix}`}
                    >
                      {sourceType.label}
                    </button>
                  );
                })
              ) : (
                // A single source: render it as the selected, non-interactive entry rather than
                // a list with one choice.
                <div
                  className="exploreLanguagePicker__sourceType exploreLanguagePicker__sourceType--selected"
                  aria-current="true"
                  data-test-subj={`queryPanelFooterSourceType-${sourceTypes[0].testSubjSuffix}`}
                >
                  {sourceTypes[0].label}
                </div>
              )}
            </div>
          )}
          <div
            className="exploreLanguagePicker__section"
            role="group"
            aria-labelledby={queryLanguageTitleId}
          >
            <div
              className="exploreLanguagePicker__sectionTitle exploreLanguagePicker__sectionTitle--flush"
              id={queryLanguageTitleId}
            >
              {queryLanguageTitle}
            </div>
            {describesLanguages ? (
              <>
                <div className="exploreLanguagePicker__languages">{languageChips}</div>
                {aiChip && <div className="exploreLanguagePicker__chips">{aiChip}</div>}
              </>
            ) : (
              // One wrapping row: the AI chip flows with the languages rather than being pinned
              // to its own line.
              <div className="exploreLanguagePicker__chips">
                {languageChips}
                {aiChip}
              </div>
            )}
            {footer}
          </div>
        </div>
      </EuiPopover>
    </div>
  );
};
