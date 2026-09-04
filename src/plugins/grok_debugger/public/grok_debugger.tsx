/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiCheckbox,
  EuiForm,
  EuiFormRow,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTextArea,
  EuiToolTip,
  EuiTitle,
  EuiBasicTable,
  EuiText,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { HttpSetup } from 'src/core/public';

interface Props {
  http: HttpSetup;
  dataSourceId?: string;
}

const STORAGE_KEY = 'grokDebugger';
const load = (key: string, fallback = '') => {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY}.${key}`) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: string) => {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}.${key}`, value);
  } catch {
    // storage unavailable, ignore
  }
};

export const GrokDebugger = ({ http, dataSourceId }: Props) => {
  const [pattern, setPattern] = useState(() => load('pattern'));
  const [sampleLog, setSampleLog] = useState(() => load('sampleLog'));
  const [customPatterns, setCustomPatterns] = useState(() => load('customPatterns'));
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureAllMatches, setCaptureAllMatches] = useState(
    () => load('captureAllMatches') === 'true'
  );
  const [customPatternError, setCustomPatternError] = useState<string | null>(null);

  useEffect(() => {
    save('pattern', pattern);
  }, [pattern]);
  useEffect(() => {
    save('sampleLog', sampleLog);
  }, [sampleLog]);
  useEffect(() => {
    save('customPatterns', customPatterns);
  }, [customPatterns]);
  useEffect(() => {
    save('captureAllMatches', String(captureAllMatches));
  }, [captureAllMatches]);

  const simulate = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const patternDefinitions: Record<string, string> = {};
    const malformed: number[] = [];
    customPatterns.split('\n').forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const spaceIdx = trimmed.search(/\s/);
      if (spaceIdx <= 0) {
        malformed.push(i + 1);
      } else {
        patternDefinitions[trimmed.slice(0, spaceIdx)] = trimmed.slice(spaceIdx).trimStart();
      }
    });
    if (malformed.length > 0) {
      setCustomPatternError(
        i18n.translate('grokDebugger.malformedPatternError', {
          defaultMessage:
            'Malformed pattern definition on line{suffix} {lines} — each line must be: PATTERN_NAME regex',
          values: { suffix: malformed.length > 1 ? 's' : '', lines: malformed.join(', ') },
        })
      );
      setIsLoading(false);
      return;
    }
    setCustomPatternError(null);

    const grokProcessor: Record<string, any> = {
      field: 'message',
      patterns: [pattern],
    };
    if (Object.keys(patternDefinitions).length > 0) {
      grokProcessor.pattern_definitions = patternDefinitions;
    }
    if (captureAllMatches) grokProcessor.capture_all_matches = true;

    const body = JSON.stringify({
      pipeline: {
        processors: [{ grok: grokProcessor }],
      },
      docs: [{ _source: { message: sampleLog } }],
    });

    try {
      const response = await http.post('/api/console/proxy', {
        query: {
          path: '_ingest/pipeline/_simulate',
          method: 'POST',
          ...(dataSourceId && { dataSourceId }),
        },
        body,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response as any;
      const doc = data?.docs?.[0];

      if (doc?.error) {
        const reason =
          doc.error?.root_cause?.[0]?.reason ??
          doc.error?.reason ??
          i18n.translate('grokDebugger.unknownError', { defaultMessage: 'Unknown error' });
        setError(reason);
      } else if (doc?.doc?._source) {
        setResult(doc.doc._source);
      } else {
        setError(
          i18n.translate('grokDebugger.unexpectedResponse', {
            defaultMessage: 'Unexpected response format',
          })
        );
      }
    } catch (e: any) {
      const reason =
        e?.body?.error?.root_cause?.[0]?.reason ??
        e?.body?.error?.reason ??
        e?.body?.message ??
        e?.message ??
        i18n.translate('grokDebugger.requestFailed', { defaultMessage: 'Request failed' });
      setError(reason);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setSampleLog('');
    setPattern('');
    setCustomPatterns('');
    setCaptureAllMatches(false);
    setResult(null);
    setError(null);
    try {
      ['pattern', 'sampleLog', 'customPatterns', 'captureAllMatches'].forEach((k) =>
        sessionStorage.removeItem(`${STORAGE_KEY}.${k}`)
      );
    } catch {
      // storage unavailable, ignore
    }
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          <EuiPageContentBody>
            <EuiFlexGroup alignItems="flexStart">
              {/* Left panel: input form */}
              <EuiFlexItem>
                <EuiFlexGroup justifyContent="flexEnd">
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      href="https://docs.opensearch.org/latest/ingest-pipelines/processors/grok/"
                      target="_blank"
                      iconType="popout"
                      iconSide="right"
                      size="s"
                    >
                      {i18n.translate('grokDebugger.docButton', {
                        defaultMessage: 'Grok documentation',
                      })}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                <EuiForm>
                  <EuiFormRow
                    label={i18n.translate('grokDebugger.sampleLogLabel', {
                      defaultMessage: 'Sample Log',
                    })}
                    fullWidth
                  >
                    <EuiTextArea
                      fullWidth
                      value={sampleLog}
                      onChange={(e) => setSampleLog(e.target.value)}
                      rows={4}
                      placeholder={i18n.translate('grokDebugger.sampleLogPlaceholder', {
                        defaultMessage: 'e.g. 127.0.0.1 198.126.12 10/Oct/2025:13:55:36 -0700 200',
                      })}
                    />
                  </EuiFormRow>
                  <EuiFormRow
                    label={i18n.translate('grokDebugger.grokPatternLabel', {
                      defaultMessage: 'Grok Pattern',
                    })}
                    fullWidth
                  >
                    <EuiTextArea
                      fullWidth
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      rows={4}
                      placeholder={i18n.translate('grokDebugger.grokPatternPlaceholder', {
                        defaultMessage: 'e.g. {example}',
                        values: {
                          example:
                            '%{IPORHOST:clientip} %{HTTPDATE:timestamp} %{NUMBER:response_status:int}',
                        },
                      })}
                    />
                  </EuiFormRow>
                  <EuiSpacer size="m" />
                  <EuiPanel paddingSize="none" hasBorder>
                    <EuiAccordion
                      id="advanced_config"
                      buttonContent={i18n.translate('grokDebugger.advancedSettings', {
                        defaultMessage: 'Advanced settings',
                      })}
                      buttonProps={{ style: { padding: '8px 12px' } }}
                      paddingSize="m"
                    >
                      <EuiFormRow
                        label={i18n.translate('grokDebugger.customPatternsLabel', {
                          defaultMessage: 'Custom pattern definitions',
                        })}
                        fullWidth
                        isInvalid={!!customPatternError}
                        error={customPatternError}
                      >
                        <EuiTextArea
                          fullWidth
                          value={customPatterns}
                          onChange={(e) => {
                            setCustomPatterns(e.target.value);
                            setCustomPatternError(null);
                          }}
                          rows={4}
                          isInvalid={!!customPatternError}
                          placeholder={i18n.translate('grokDebugger.customPatternsPlaceholder', {
                            defaultMessage:
                              'CUSTOM_PATTERN (?:[a-zA-Z0-9._-]+)\nEach line: PATTERN_NAME pattern_regex',
                          })}
                        />
                      </EuiFormRow>
                      <EuiFormRow>
                        <EuiToolTip
                          content={i18n.translate('grokDebugger.captureAllMatchesTooltip', {
                            defaultMessage:
                              'Collects all matches of repeated patterns into an array. For example, given "192.168.1.1 10.0.0.1 172.16.0.1" and pattern "{patternExample}", all three IPs are collected into the ipAddress field.',
                            values: {
                              patternExample: '%{IP:ipAddress} %{IP:ipAddress} %{IP:ipAddress}',
                            },
                          })}
                        >
                          <EuiCheckbox
                            id="capture_all_matches"
                            label={i18n.translate('grokDebugger.captureAllMatchesLabel', {
                              defaultMessage: 'Capture all matches',
                            })}
                            checked={captureAllMatches}
                            onChange={(e) => setCaptureAllMatches(e.target.checked)}
                          />
                        </EuiToolTip>
                      </EuiFormRow>
                    </EuiAccordion>
                  </EuiPanel>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup gutterSize="s" alignItems="center">
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        fill
                        size="s"
                        onClick={simulate}
                        isLoading={isLoading}
                        isDisabled={!pattern.trim() || !sampleLog.trim()}
                      >
                        {i18n.translate('grokDebugger.simulateButton', {
                          defaultMessage: 'Simulate',
                        })}
                      </EuiButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButton size="s" onClick={clear}>
                        {i18n.translate('grokDebugger.clearButton', { defaultMessage: 'Clear' })}
                      </EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiForm>
              </EuiFlexItem>

              {/* Right panel: result */}
              <EuiFlexItem>
                <EuiPanel paddingSize="none" hasBorder>
                  {/* Header bar */}
                  <EuiPanel
                    color="subdued"
                    paddingSize="none"
                    hasShadow={false}
                    borderRadius="none"
                    style={{ padding: '12px 16px' }}
                  >
                    <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiTitle size="xs">
                          <h2>
                            {i18n.translate('grokDebugger.resultsTitle', {
                              defaultMessage: 'Results',
                            })}
                          </h2>
                        </EuiTitle>
                      </EuiFlexItem>
                      {result && (
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="success">
                            <span>
                              {i18n.translate('grokDebugger.patternMatched', {
                                defaultMessage: '✓ Pattern matched',
                              })}
                            </span>
                          </EuiText>
                        </EuiFlexItem>
                      )}
                      {error && (
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="danger">
                            <span>
                              {i18n.translate('grokDebugger.patternMatchFailed', {
                                defaultMessage: '✗ Pattern match failed',
                              })}
                            </span>
                          </EuiText>
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  </EuiPanel>
                  {/* Body */}
                  <EuiPanel paddingSize="m" hasShadow={false} hasBorder={false} borderRadius="none">
                    {!result && !error && (
                      <EuiText color="subdued">
                        <p>
                          {i18n.translate('grokDebugger.resultsPlaceholder', {
                            defaultMessage: 'Run Simulate to see results.',
                          })}
                        </p>
                      </EuiText>
                    )}
                    {error && (
                      <EuiText size="s" color="danger">
                        <p>
                          {i18n.translate('grokDebugger.errorHint', {
                            defaultMessage:
                              'Correct the grok pattern or add custom pattern definitions.',
                          })}
                        </p>
                        <p>{error}</p>
                      </EuiText>
                    )}
                    {result && (
                      <EuiBasicTable
                        items={Object.entries(result as Record<string, any>).map(
                          ([field, value]) => ({
                            field,
                            value:
                              typeof value === 'object' ? JSON.stringify(value) : String(value),
                          })
                        )}
                        columns={[
                          {
                            field: 'field',
                            name: i18n.translate('grokDebugger.fieldColumn', {
                              defaultMessage: 'Field',
                            }),
                            width: '30%',
                          },
                          {
                            field: 'value',
                            name: i18n.translate('grokDebugger.valueColumn', {
                              defaultMessage: 'Value',
                            }),
                          },
                        ]}
                      />
                    )}
                  </EuiPanel>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
