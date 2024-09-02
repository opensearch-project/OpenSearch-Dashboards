/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCard, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

const WorkspaceFaqItem = ({ question, answer }: { question: string; answer: string }) => {
  return (
    <EuiText size="xs">
      <h4>{question}</h4>
      <p>{answer}</p>
    </EuiText>
  );
};

const FAQs = [
  {
    question: i18n.translate('workspace.form.faq.panel.question1', {
      defaultMessage: 'Can I change the workspace use case later?',
    }),
    answer: i18n.translate('workspace.form.faq.panel.answer1', {
      defaultMessage: 'You can only change to the All use case after workspace creation.',
    }),
  },
  {
    question: i18n.translate('workspace.form.faq.panel.question2', {
      defaultMessage: 'Why can’t I find the data sources I want to attached to the workspace? ',
    }),
    answer: i18n.translate('workspace.form.faq.panel.answer2', {
      defaultMessage:
        'Available data sources to all workspaces here are configured by OpenSearch admin. Contact OpenSearch admin within your organization to add the requested data source. ',
    }),
  },
  {
    question: i18n.translate('workspace.form.faq.panel.question3', {
      defaultMessage:
        'Do the added team members automatically gain access to the attached data sources?',
    }),
    answer: i18n.translate('workspace.form.faq.panel.answer3', {
      defaultMessage:
        'No. Adding team members will only grant them access to the created workspace. To grant access to the attached data sources, contact the data source admin within your organization.',
    }),
  },
];

export const WorkspaceFaqPanel = () => {
  return (
    <EuiCard
      title={i18n.translate('workspace.form.faq.panel.title', {
        defaultMessage: 'FAQs',
      })}
      textAlign="left"
      titleSize="xs"
      titleElement="h3"
    >
      {FAQs.map(({ question, answer }, index) => (
        <React.Fragment key={index}>
          <WorkspaceFaqItem question={question} answer={answer} />
          {index !== FAQs.length - 1 && (
            <>
              <EuiSpacer size="s" />
              <EuiSpacer size="xs" />
            </>
          )}
        </React.Fragment>
      ))}
    </EuiCard>
  );
};
