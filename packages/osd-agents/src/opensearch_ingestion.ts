#!/usr/bin/env node

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { Client } from '@opensearch-project/opensearch';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { format, parse, isValid } from 'date-fns';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: 'logs' | 'audit-logs' | 'metrics';
  filename: string;
  raw: string;
  thread_id?: string;
  run_id?: string;
  ingestion_timestamp?: string;
  [key: string]: any;
}

interface MetricEntry {
  timestamp: string;
  metric_name: string;
  metric_type: string;
  metric_value?: number;
  source: 'metrics';
  filename: string;
  raw: string;
  ingestion_timestamp?: string;
}

class OpenSearchIngestor {
  private client: Client;
  private batchSize: number = 100;
  private batchDelay: number = 500; // Delay in ms between batches
  private processedFiles: Set<string> = new Set();
  private stateFile: string;

  constructor(options?: { batchSize?: number; batchDelay?: number }) {
    const opensearchUrl = process.env.EXTERNAL_OPENSEARCH_URL;
    const username = process.env.EXTERNAL_OPENSEARCH_USERNAME;
    const password = process.env.EXTERNAL_OPENSEARCH_PASSWORD;

    if (!opensearchUrl || !username || !password) {
      throw new Error('OpenSearch credentials not found in .env file');
    }

    // Apply custom options if provided
    if (options?.batchSize) {
      this.batchSize = options.batchSize;
    }
    if (options?.batchDelay !== undefined) {
      this.batchDelay = options.batchDelay;
    }

    console.log(`Configuration: batchSize=${this.batchSize}, batchDelay=${this.batchDelay}ms`);

    this.client = new Client({
      node: opensearchUrl,
      auth: {
        username,
        password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });

    this.stateFile = path.join(__dirname, '..', '.opensearch-ingest-state.json');
    this.loadState();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
        this.processedFiles = new Set(state.processedFiles || []);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  private saveState(): void {
    try {
      const state = {
        processedFiles: Array.from(this.processedFiles),
        lastRun: new Date().toISOString(),
      };
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  private getDailyIndexName(type: 'logs' | 'audit-logs' | 'metrics'): string {
    const today = format(new Date(), 'yyyy.MM.dd');
    switch (type) {
      case 'logs':
        return `ai-agent-logs-${today}`;
      case 'audit-logs':
        return `ai-agent-audit-logs-${today}`;
      case 'metrics':
        return `ai-agent-metrics-${today}`;
      default:
        return `ai-agent-logs-${today}`;
    }
  }

  private async createIndexIfNotExists(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      if (!exists.body) {
        await this.client.indices.create({
          index: indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
            },
            mappings: {
              properties: {
                timestamp: {
                  type: 'date',
                  format: 'strict_date_optional_time||epoch_millis',
                },
                level: { type: 'keyword' },
                message: { type: 'text' },
                source: { type: 'keyword' },
                filename: { type: 'keyword' },
                thread_id: { type: 'keyword' },
                run_id: { type: 'keyword' },
                metric_name: { type: 'keyword' },
                metric_type: { type: 'keyword' },
                metric_value: { type: 'float' },
                raw: { type: 'text' },
                ingestion_timestamp: { type: 'date' },
              },
            },
          },
        });
        console.log(`Created index: ${indexName}`);
      }
    } catch (error) {
      console.error(`Error creating index ${indexName}:`, error);
    }
  }

  private parseLogLine(line: string, filename: string): LogEntry | null {
    try {
      // Skip empty lines
      if (!line.trim()) return null;

      // Parse different log formats
      const isoTimestampMatch = line.match(
        /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]\s+(\w+):\s+(.*)/
      );
      const readableTimestampMatch = line.match(
        /^\[([^\]]+)\]\s+(?:\[([^\]]+)\])?\s*(\w+):\s+(.*)/
      );

      let entry: LogEntry | null = null;

      if (isoTimestampMatch) {
        // ISO format timestamp - use as-is
        entry = {
          timestamp: isoTimestampMatch[1],
          level: isoTimestampMatch[2],
          message: isoTimestampMatch[3],
          source: filename.includes('audit') ? 'audit-logs' : 'logs',
          filename,
          raw: line,
          ingestion_timestamp: new Date().toISOString(),
        };
      } else if (readableTimestampMatch) {
        const dateStr = readableTimestampMatch[1];
        const contextInfo = readableTimestampMatch[2];
        const level = readableTimestampMatch[3];
        const message = readableTimestampMatch[4];

        // Convert human-readable timestamp to ISO format
        let parsedTimestamp: string;
        try {
          // Parse the format "Sep 21, 2025, 23:40:48 PDT"
          const dateFormats = [
            'MMM dd, yyyy, HH:mm:ss zzz',
            'MMM dd, yyyy, HH:mm:ss',
            'yyyy-MM-dd HH:mm:ss',
            'MM/dd/yyyy HH:mm:ss',
          ];

          let parsedDate: Date | null = null;
          for (const formatStr of dateFormats) {
            try {
              parsedDate = parse(dateStr, formatStr, new Date());
              if (isValid(parsedDate)) {
                break;
              }
            } catch (e) {
              // Try next format
            }
          }

          if (parsedDate && isValid(parsedDate)) {
            parsedTimestamp = parsedDate.toISOString();
          } else {
            // Fallback: use current time if parsing fails
            console.warn(`Could not parse timestamp: ${dateStr}, using current time`);
            parsedTimestamp = new Date().toISOString();
          }
        } catch (error) {
          console.warn(`Error parsing timestamp: ${dateStr}, using current time`, error);
          parsedTimestamp = new Date().toISOString();
        }

        entry = {
          timestamp: parsedTimestamp,
          level,
          message,
          source: filename.includes('audit') ? 'audit-logs' : 'logs',
          filename,
          raw: line,
          ingestion_timestamp: new Date().toISOString(),
        };

        // Extract thread_id and run_id if present
        if (contextInfo) {
          const threadMatch = contextInfo.match(/thread_id=([^,\s]+)/);
          const runMatch = contextInfo.match(/run_id=([^,\s]+)/);
          if (threadMatch) entry.thread_id = threadMatch[1];
          if (runMatch) entry.run_id = runMatch[1];
        }
      } else if (line.trim()) {
        // Default fallback for unparsed lines - extract file timestamp if possible
        const fileTimestamp = this.extractTimestampFromFilename(filename);
        entry = {
          timestamp: fileTimestamp || new Date().toISOString(),
          level: 'INFO',
          message: line,
          source: filename.includes('audit') ? 'audit-logs' : 'logs',
          filename,
          raw: line,
          ingestion_timestamp: new Date().toISOString(),
        };
      }

      return entry;
    } catch (error) {
      console.error(`Error parsing log line: ${error}`);
      console.error(`Problem line: ${line}`);
      return null;
    }
  }

  private extractTimestampFromFilename(filename: string): string | null {
    // Extract timestamp from filename like "ai-agent-2025-09-16-15.log"
    const match = filename.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day, hour] = match;
      return `${year}-${month}-${day}T${hour}:00:00.000Z`;
    }
    return null;
  }

  private parseMetricLine(line: string, filename: string): MetricEntry | null {
    try {
      if (line.startsWith('#')) {
        // Parse Prometheus comment lines
        const helpMatch = line.match(/^# HELP (\w+) (.*)/);
        const typeMatch = line.match(/^# TYPE (\w+) (\w+)/);

        const fileTimestamp = this.extractTimestampFromFilename(filename);

        if (helpMatch) {
          return {
            timestamp: fileTimestamp || new Date().toISOString(),
            metric_name: helpMatch[1],
            metric_type: 'help',
            source: 'metrics',
            filename,
            raw: line,
            ingestion_timestamp: new Date().toISOString(),
          };
        } else if (typeMatch) {
          return {
            timestamp: fileTimestamp || new Date().toISOString(),
            metric_name: typeMatch[1],
            metric_type: typeMatch[2],
            source: 'metrics',
            filename,
            raw: line,
            ingestion_timestamp: new Date().toISOString(),
          };
        }
      } else {
        // Parse metric value lines
        const metricMatch = line.match(/^(\w+)(?:\{([^}]*)\})?\s+([\d.]+)/);
        if (metricMatch) {
          const fileTimestamp = this.extractTimestampFromFilename(filename);
          return {
            timestamp: fileTimestamp || new Date().toISOString(),
            metric_name: metricMatch[1],
            metric_type: 'value',
            metric_value: parseFloat(metricMatch[3]),
            source: 'metrics',
            filename,
            raw: line,
            ingestion_timestamp: new Date().toISOString(),
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Error parsing metric line: ${error}`);
      return null;
    }
  }

  private async processFile(
    filePath: string,
    type: 'logs' | 'audit-logs' | 'metrics'
  ): Promise<void> {
    if (this.processedFiles.has(filePath)) {
      console.log(`Skipping already processed file: ${filePath}`);
      return;
    }

    console.log(`Processing ${type} file: ${filePath}`);
    const filename = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let batch: any[] = [];
    const indexName = this.getDailyIndexName(type);

    for await (const line of rl) {
      if (!line.trim()) continue;

      let entry: any = null;
      if (type === 'metrics') {
        entry = this.parseMetricLine(line, filename);
      } else {
        entry = this.parseLogLine(line, filename);
      }

      if (entry) {
        batch.push(entry);

        if (batch.length >= this.batchSize) {
          await this.bulkIndex(batch, indexName);
          batch = [];

          // Add delay between batches to avoid overwhelming OpenSearch
          if (this.batchDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.batchDelay));
          }
        }
      }
    }

    // Index remaining entries
    if (batch.length > 0) {
      await this.bulkIndex(batch, indexName);
    }

    this.processedFiles.add(filePath);
    this.saveState();
    console.log(`Completed processing ${filePath}`);
  }

  private async bulkIndex(entries: any[], indexName: string, retries: number = 3): Promise<void> {
    if (entries.length === 0) return;

    const body = entries.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.bulk({ body });

        if (response.body.errors) {
          // Extract failed documents for retry
          const failedDocs: any[] = [];
          const successfulDocs: number[] = [];

          response.body.items.forEach((item: any, index: number) => {
            if (item.index && item.index.error) {
              console.error(`Document ${index} failed:`, item.index.error);
              failedDocs.push(entries[index]);
            } else {
              successfulDocs.push(index);
            }
          });

          console.log(
            `Successfully indexed ${successfulDocs.length}/${entries.length} documents to ${indexName}`
          );

          // Retry failed documents if any
          if (failedDocs.length > 0 && attempt < retries) {
            console.log(
              `Retrying ${failedDocs.length} failed documents (attempt ${
                attempt + 1
              }/${retries})...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            entries = failedDocs; // Update entries for next retry
            continue;
          } else if (failedDocs.length > 0) {
            console.error(
              `Failed to index ${failedDocs.length} documents after ${retries} attempts`
            );
            // Optionally save failed documents to a file for manual recovery
            this.saveFailedDocuments(failedDocs, indexName);
          }
        } else {
          console.log(`Successfully indexed ${entries.length} documents to ${indexName}`);
        }

        return; // Success, exit the retry loop
      } catch (error: any) {
        console.error(`Bulk indexing attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          const backoffTime = 1000 * attempt; // Exponential backoff
          console.log(`Waiting ${backoffTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          console.error(`Failed to index batch after ${retries} attempts`);
          // Save failed documents for manual recovery
          this.saveFailedDocuments(entries, indexName);
        }
      }
    }
  }

  private saveFailedDocuments(docs: any[], indexName: string): void {
    try {
      const failedDir = path.join(__dirname, '..', 'failed-indexing');
      if (!fs.existsSync(failedDir)) {
        fs.mkdirSync(failedDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(failedDir, `failed-indexing-${indexName}-${timestamp}.json`);

      fs.writeFileSync(filename, JSON.stringify({ index: indexName, documents: docs }, null, 2));
      console.log(`Saved ${docs.length} failed documents to ${filename} for manual recovery`);
    } catch (error) {
      console.error('Failed to save failed documents:', error);
    }
  }

  public async ingestAll(): Promise<void> {
    const baseDir = path.join(__dirname, '..');

    // Create indices for each type
    await this.createIndexIfNotExists(this.getDailyIndexName('logs'));
    await this.createIndexIfNotExists(this.getDailyIndexName('audit-logs'));
    await this.createIndexIfNotExists(this.getDailyIndexName('metrics'));

    // Process logs
    const logsDir = path.join(baseDir, 'logs');
    if (fs.existsSync(logsDir)) {
      const logFiles = fs
        .readdirSync(logsDir)
        .filter((f) => f.endsWith('.log'))
        .map((f) => path.join(logsDir, f));

      for (const file of logFiles) {
        await this.processFile(file, 'logs');
      }
    }

    // Process audit logs
    const auditLogsDir = path.join(baseDir, 'audit-logs');
    if (fs.existsSync(auditLogsDir)) {
      const auditFiles = fs
        .readdirSync(auditLogsDir)
        .filter((f) => f.endsWith('.log'))
        .map((f) => path.join(auditLogsDir, f));

      for (const file of auditFiles) {
        await this.processFile(file, 'audit-logs');
      }
    }

    // Process metrics
    const metricsDir = path.join(baseDir, 'metrics');
    if (fs.existsSync(metricsDir)) {
      const metricFiles = fs
        .readdirSync(metricsDir)
        .filter((f) => f.endsWith('.prom'))
        .map((f) => path.join(metricsDir, f));

      for (const file of metricFiles) {
        await this.processFile(file, 'metrics');
      }
    }

    console.log('Ingestion complete!');
  }

  public async watchAndIngest(): Promise<void> {
    console.log('Starting continuous ingestion with file watching...');

    // Initial ingestion
    await this.ingestAll();

    // Watch for new files
    const baseDir = path.join(__dirname, '..');
    const dirs = [
      { path: path.join(baseDir, 'logs'), type: 'logs' as const },
      { path: path.join(baseDir, 'audit-logs'), type: 'audit-logs' as const },
      { path: path.join(baseDir, 'metrics'), type: 'metrics' as const },
    ];

    for (const dir of dirs) {
      if (fs.existsSync(dir.path)) {
        fs.watch(dir.path, async (eventType, filename) => {
          if (eventType === 'change' || eventType === 'rename') {
            const filePath = path.join(dir.path, filename);
            if (fs.existsSync(filePath) && !this.processedFiles.has(filePath)) {
              console.log(`New file detected: ${filePath}`);
              await this.processFile(filePath, dir.type);
            }
          }
        });
        console.log(`Watching directory: ${dir.path}`);
      }
    }

    // Keep process running
    process.on('SIGINT', () => {
      console.log('Shutting down gracefully...');
      this.saveState();
      process.exit(0);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');

  // Parse command line options
  let batchSize: number | undefined;
  let batchDelay: number | undefined;

  const batchSizeIndex = args.findIndex((arg) => arg.startsWith('--batch-size='));
  if (batchSizeIndex !== -1) {
    batchSize = parseInt(args[batchSizeIndex].split('=')[1], 10);
  }

  const batchDelayIndex = args.findIndex((arg) => arg.startsWith('--batch-delay='));
  if (batchDelayIndex !== -1) {
    batchDelay = parseInt(args[batchDelayIndex].split('=')[1], 10);
  }

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
OpenSearch Ingestion Tool

Usage: npm run opensearch:ingest [options]

Options:
  --watch, -w           Watch mode - continuously monitor for new files
  --batch-size=N        Number of documents per batch (default: 100)
  --batch-delay=N       Delay in milliseconds between batches (default: 500)
  --help, -h            Show this help message

Examples:
  npm run opensearch:ingest                          # One-time ingestion with defaults
  npm run opensearch:ingest --batch-size=50          # Smaller batches
  npm run opensearch:ingest --batch-delay=1000       # 1 second delay between batches
  npm run opensearch:watch --batch-size=25 --batch-delay=2000  # Watch mode with custom settings
    `);
    process.exit(0);
  }

  const ingestor = new OpenSearchIngestor({ batchSize, batchDelay });

  try {
    if (watchMode) {
      await ingestor.watchAndIngest();
    } else {
      await ingestor.ingestAll();
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { OpenSearchIngestor };
