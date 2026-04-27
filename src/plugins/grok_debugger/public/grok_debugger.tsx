/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiCallOut,
  EuiCheckbox,
  EuiCodeBlock,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTextArea,
  EuiToolTip,
} from '@elastic/eui';
import { HttpSetup } from 'src/core/public';

interface Props {
  http: HttpSetup;
}

export const GrokDebugger = ({ http }: Props) => {
  const [pattern, setPattern] = useState('');
  const [sampleLog, setSampleLog] = useState('');
  const [customPatterns, setCustomPatterns] = useState('');
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureAllMatches, setCaptureAllMatches] = useState(false);

  const simulate = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const patternDefinitions: Record<string, string> = {};
    customPatterns.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const spaceIdx = trimmed.indexOf(' ');
      if (spaceIdx > 0) {
        patternDefinitions[trimmed.slice(0, spaceIdx)] = trimmed.slice(spaceIdx + 1);
      }
    });

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
        },
        body,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response as any;
      const doc = data?.docs?.[0];

      if (doc?.error) {
        const reason = doc.error?.root_cause?.[0]?.reason ?? doc.error?.reason ?? 'Unknown error';
        setError(reason);
      } else if (doc?.doc?._source) {
        setResult(doc.doc._source);
      } else {
        setError('Unexpected response format');
      }
    } catch (e: any) {
      const reason =
        e?.body?.error?.root_cause?.[0]?.reason ??
        e?.body?.error?.reason ??
        e?.body?.message ??
        e?.message ??
        'Request failed';
      setError(reason);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          <EuiPageContentBody>
            <EuiText>
              <p>
                Use the Grok Debugger to test and debug grok patterns against sample log data before
                using them in an ingest pipeline. Enter a sample log line and a grok pattern to
                simulate how OpenSearch would parse and extract fields from that log.
              </p>
            </EuiText>
            <EuiSpacer size="m" />
            <EuiForm>
              <EuiFormRow label="Sample Log" fullWidth>
                <EuiTextArea
                  fullWidth
                  value={sampleLog}
                  onChange={(e) => setSampleLog(e.target.value)}
                  rows={3}
                  placeholder="e.g. 127.0.0.1 198.126.12 10/Oct/2025:13:55:36 -0700 200"
                />
              </EuiFormRow>
              <EuiFormRow label="Grok Pattern" fullWidth>
                <EuiFieldText
                  fullWidth
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. %{IPORHOST:clientip} %{HTTPDATE:timestamp} %{NUMBER:response_status:int}"
                />
              </EuiFormRow>
              <EuiSpacer size="m" />
              <EuiAccordion id="advanced_config" buttonContent="Advanced settings">
                <EuiSpacer size="s" />
                <EuiFormRow
                  label="Custom Patterns"
                  helpText="One pattern per line: PATTERN_NAME pattern_regex"
                  fullWidth
                >
                  <EuiTextArea
                    fullWidth
                    value={customPatterns}
                    onChange={(e) => setCustomPatterns(e.target.value)}
                    rows={4}
                    placeholder={'e.g.\nNUMBER \\d{3,4}\nSTATUS open|closed'}
                  />
                </EuiFormRow>
                <EuiFormRow>
                  <EuiToolTip content='Collects all matches of repeated patterns into an array. For example, given "192.168.1.1 10.0.0.1 172.16.0.1" and pattern "%{IP:ipAddress} %{IP:ipAddress} %{IP:ipAddress}", all three IPs are collected into the ipAddress field.'>
                    <EuiCheckbox
                      id="capture_all_matches"
                      label="Capture all matches"
                      checked={captureAllMatches}
                      onChange={(e) => setCaptureAllMatches(e.target.checked)}
                    />
                  </EuiToolTip>
                </EuiFormRow>
              </EuiAccordion>
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    fill
                    onClick={simulate}
                    isLoading={isLoading}
                    isDisabled={!pattern.trim() || !sampleLog.trim()}
                  >
                    Simulate
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiForm>

            {error && (
              <>
                <EuiSpacer size="m" />
                <EuiCallOut title="Pattern did not match" color="danger" iconType="alert">
                  <p>{error}</p>
                </EuiCallOut>
              </>
            )}

            {result && (
              <>
                <EuiSpacer size="m" />
                <EuiCallOut title="Match successful" color="success" iconType="check">
                  <EuiCodeBlock language="json" isCopyable>
                    {JSON.stringify(result, null, 2)}
                  </EuiCodeBlock>
                </EuiCallOut>
              </>
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
