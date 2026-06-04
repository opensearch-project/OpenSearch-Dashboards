/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Flyout for creating Prometheus alert rules from the Metrics page queries.
 * Each query row becomes a separate Cortex alerting rule, all created via
 * POST /api/alerting/prometheus/{dsId}/rules.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

const OPERATOR_OPTIONS = [
  { value: '>', text: '> (greater than)' },
  { value: '>=', text: '>= (greater or equal)' },
  { value: '<', text: '< (less than)' },
  { value: '<=', text: '<= (less or equal)' },
  { value: '==', text: '== (equals)' },
  { value: '!=', text: '!= (not equal)' },
];

const DURATION_OPTIONS = [
  { value: '0s', text: 'Immediately (0s)' },
  { value: '30s', text: '30 seconds' },
  { value: '1m', text: '1 minute' },
  { value: '2m', text: '2 minutes' },
  { value: '5m', text: '5 minutes' },
  { value: '10m', text: '10 minutes' },
];

const INTERVAL_OPTIONS = [
  { value: '15s', text: '15 seconds' },
  { value: '30s', text: '30 seconds' },
  { value: '1m', text: '1 minute' },
  { value: '2m', text: '2 minutes' },
  { value: '5m', text: '5 minutes' },
];

interface RuleEntry {
  id: string;
  query: string;
  name: string;
  operator: string;
  threshold: number;
  forDuration: string;
}

export interface CreateMetricsRuleFlyoutProps {
  queries: string[];
  datasourceId: string;
  onClose: () => void;
  http: {
    post: (path: string, options: { body: string }) => Promise<unknown>;
    get: (path: string) => Promise<unknown>;
  };
  addToast?: (title: string, color?: 'success' | 'danger') => void;
}

function deriveRuleName(query: string): string {
  const match = query.match(/\b([a-zA-Z_:][a-zA-Z0-9_:]*)\s*[{([\s]/);
  if (match) return match[1];
  const simpleMatch = query.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)/);
  if (simpleMatch) return simpleMatch[1];
  return 'metrics_alert';
}

export const CreateMetricsRuleFlyout: React.FC<CreateMetricsRuleFlyoutProps> = ({
  queries,
  datasourceId,
  onClose,
  http,
  addToast,
}) => {
  const [evaluationInterval, setEvaluationInterval] = useState('1m');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'creating' | 'confirming' | 'done'>(
    'idle'
  );

  const [rules, setRules] = useState<RuleEntry[]>(() =>
    queries
      .filter((q) => q.trim())
      .map((q, idx) => ({
        id: `rule-${idx}`,
        query: q.trim(),
        name: deriveRuleName(q),
        operator: '>',
        threshold: 0,
        forDuration: '5m',
      }))
  );

  const updateRule = useCallback((ruleId: string, field: keyof RuleEntry, value: unknown) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r)));
  }, []);

  const isValid = useMemo(() => rules.length > 0 && rules.every((r) => r.name.trim()), [rules]);

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setSaveStatus('creating');
    try {
      for (const rule of rules) {
        const payload = {
          name: rule.name,
          query: rule.query,
          operator: rule.operator,
          threshold: rule.threshold,
          forDuration: rule.forDuration,
          evaluationInterval,
          labels: {},
          annotations: { summary: `Alert: ${rule.name}` },
          enabled: true,
          groupName: rule.name,
        };
        await http.post(`/api/alerting/prometheus/${encodeURIComponent(datasourceId)}/rules`, {
          body: JSON.stringify(payload),
        });
      }

      // Poll Cortex until the rules appear (up to 90s, every 5s)
      setSaveStatus('confirming');
      const ruleNames = new Set(rules.map((r) => r.name));
      const maxAttempts = 18; // 18 * 5s = 90s
      let confirmed = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try {
          const resp = (await http.get(
            `/api/alerting/prometheus/${encodeURIComponent(datasourceId)}/rules`
          )) as { groups?: Array<{ name: string }> };
          const existingGroups = new Set(
            (resp?.groups || []).map((g) => g.name)
          );
          if ([...ruleNames].every((name) => existingGroups.has(name))) {
            confirmed = true;
            break;
          }
        } catch {
          // Ignore fetch errors during polling, keep trying
        }
      }

      setSaveStatus('done');
      addToast?.(
        confirmed
          ? i18n.translate('explore.metricsRule.toast.confirmed', {
              defaultMessage: '{count} alert rule(s) created and confirmed.',
              values: { count: rules.length },
            })
          : i18n.translate('explore.metricsRule.toast.created', {
              defaultMessage:
                '{count} alert rule(s) created. They may take a moment to appear on the Rules page.',
              values: { count: rules.length },
            }),
        'success'
      );

      // Brief delay to show "Created ✓" state before closing
      setTimeout(() => onClose(), 1000);
    } catch {
      setSaveStatus('idle');
      addToast?.(
        i18n.translate('explore.metricsRule.toast.failed', {
          defaultMessage: 'Failed to create alert rules',
        }),
        'danger'
      );
    } finally {
      setIsSaving(false);
    }
  }, [rules, evaluationInterval, datasourceId, http, isValid, isSaving, onClose, addToast]);

  return (
    <EuiFlyout onClose={onClose} size="l" ownFocus aria-labelledby="createMetricsRuleTitle">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id="createMetricsRuleTitle">
            {i18n.translate('explore.metricsRule.title', {
              defaultMessage: 'Create alert rules from metrics queries',
            })}
          </h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.metricsRule.description', {
            defaultMessage:
              'Each query becomes an alerting rule. Configure thresholds and conditions below.',
          })}
        </EuiText>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiPanel paddingSize="m" color="subdued">
          <EuiTitle size="xs">
            <h3>Evaluation Settings</h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem>
              <EuiFormRow label="Evaluation interval">
                <EuiSelect
                  options={INTERVAL_OPTIONS}
                  value={evaluationInterval}
                  onChange={(e) => setEvaluationInterval(e.target.value)}
                  compressed
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>

        <EuiSpacer size="m" />

        {rules.map((rule, idx) => (
          <React.Fragment key={rule.id}>
            <EuiPanel paddingSize="m">
              <EuiTitle size="xxs">
                <h4>Query {idx + 1}</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <EuiCallOut size="s" color="primary" iconType="editorCodeBlock">
                <code>{rule.query}</code>
              </EuiCallOut>
              <EuiSpacer size="s" />
              <EuiFlexGroup gutterSize="s" wrap>
                <EuiFlexItem style={{ minWidth: 200 }}>
                  <EuiFormRow label="Rule name">
                    <EuiFieldText
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, 'name', e.target.value)}
                      compressed
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 120 }}>
                  <EuiFormRow label="Operator">
                    <EuiSelect
                      options={OPERATOR_OPTIONS}
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                      compressed
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 100 }}>
                  <EuiFormRow label="Threshold">
                    <EuiFieldNumber
                      value={rule.threshold}
                      onChange={(e) =>
                        updateRule(rule.id, 'threshold', Number.parseFloat(e.target.value) || 0)
                      }
                      compressed
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 140 }}>
                  <EuiFormRow label="For duration">
                    <EuiSelect
                      options={DURATION_OPTIONS}
                      value={rule.forDuration}
                      onChange={(e) => updateRule(rule.id, 'forDuration', e.target.value)}
                      compressed
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
            {idx < rules.length - 1 && <EuiSpacer size="s" />}
          </React.Fragment>
        ))}

        {rules.length === 0 && (
          <EuiCallOut title="No queries to create rules from" color="warning" iconType="alert">
            <p>Add queries on the Metrics page first, then click Create alert rule.</p>
          </EuiCallOut>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={handleSave}
              isLoading={saveStatus === 'creating' || saveStatus === 'confirming'}
              disabled={!isValid || saveStatus === 'done'}
              iconType={saveStatus === 'done' ? 'check' : undefined}
            >
              {saveStatus === 'creating' &&
                i18n.translate('explore.metricsRule.saveButton.creating', {
                  defaultMessage: 'Creating in Prometheus...',
                })}
              {saveStatus === 'confirming' &&
                i18n.translate('explore.metricsRule.saveButton.confirming', {
                  defaultMessage: 'Confirming rule creation...',
                })}
              {saveStatus === 'done' &&
                i18n.translate('explore.metricsRule.saveButton.done', {
                  defaultMessage: 'Created ✓',
                })}
              {saveStatus === 'idle' &&
                i18n.translate('explore.metricsRule.saveButton', {
                  defaultMessage: 'Create {count} rule(s)',
                  values: { count: rules.length },
                })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
