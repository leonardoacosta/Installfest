import * as cheerio from 'cheerio';
import * as fs from 'fs';
import type { PlaywrightReportStats, PlaywrightTestData, TestFailure } from './types';

/**
 * Extract __playwright object from report HTML
 */
function extractPlaywrightData(html: string): PlaywrightTestData | null {
  const $ = cheerio.load(html);
  const scriptTags = $('script').toArray();

  for (const script of scriptTags) {
    const content = $(script).html();
    if (!content || !content.includes('__playwright')) continue;

    try {
      // Try multiple patterns
      const patterns = [
        /window\.__playwright\s*=\s*(\{[\s\S]*?\});/,
        /__playwright\s*=\s*(\{[\s\S]*?\});/,
        /const\s+__playwright\s*=\s*(\{[\s\S]*?\});/
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          return JSON.parse(match[1]) as PlaywrightTestData;
        }
      }
    } catch (e) {
      // Continue searching
    }
  }

  return null;
}

/**
 * Parse test failures from Playwright data object
 */
function parseFailuresFromData(data: PlaywrightTestData): TestFailure[] {
  const failures: TestFailure[] = [];

  if (!data.suites) return failures;

  for (const suite of data.suites) {
    const file = suite.file || suite.title;

    if (!suite.specs) continue;

    for (const spec of suite.specs) {
      if (!spec.tests) continue;

      for (const test of spec.tests) {
        if (test.status !== 'failed' && test.status !== 'timedOut') continue;

        const testName = spec.title;
        let errorMessage = '';
        let stackTrace = '';
        let lineNumber: number | undefined;

        if (test.results && test.results.length > 0) {
          const result = test.results[0];

          // Check for errors array (newer format)
          if (result.errors && result.errors.length > 0) {
            const error = result.errors[0];
            errorMessage = error.message || 'Test failed';
            stackTrace = error.stack || '';

            if (error.location) {
              lineNumber = error.location.line;
            }
          }
          // Check for single error object (older format)
          else if (result.error) {
            errorMessage = result.error.message || 'Test failed';
            stackTrace = result.error.stack || '';
          }
        }

        // Extract line number from stack trace if not already set
        if (!lineNumber && stackTrace) {
          const lineMatch = stackTrace.match(/at.*?:(\d+):\d+/);
          if (lineMatch) {
            lineNumber = parseInt(lineMatch[1], 10);
          }
        }

        failures.push({
          testName,
          testFile: file,
          lineNumber,
          errorMessage: errorMessage || 'Test failed (no error message)',
          stackTrace: stackTrace || undefined,
          duration: test.duration
        });
      }
    }
  }

  return failures;
}

/**
 * Fallback: Parse stats from HTML structure when __playwright data is unavailable
 */
function parseStatsFromHtml($: cheerio.CheerioAPI): Omit<PlaywrightReportStats, 'failures'> {
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  };

  // Try to extract from summary text
  const summaryText = $('.suites-header, .summary, [class*="summary"]').text();
  if (summaryText) {
    const totalMatch = summaryText.match(/(\d+)\s+tests?/i);
    const passedMatch = summaryText.match(/(\d+)\s+passed/i);
    const failedMatch = summaryText.match(/(\d+)\s+failed/i);
    const skippedMatch = summaryText.match(/(\d+)\s+skipped/i);

    if (totalMatch) stats.total = parseInt(totalMatch[1], 10);
    if (passedMatch) stats.passed = parseInt(passedMatch[1], 10);
    if (failedMatch) stats.failed = parseInt(failedMatch[1], 10);
    if (skippedMatch) stats.skipped = parseInt(skippedMatch[1], 10);
  }

  // If we still don't have totals, count test elements
  if (stats.total === 0) {
    stats.total = $('.test, [class*="test-"]').length || 0;
    stats.passed = $('.test.passed, [class*="passed"]').length || 0;
    stats.failed = $('.test.failed, [class*="failed"]').length || 0;
    stats.skipped = $('.test.skipped, [class*="skipped"]').length || 0;
  }

  return stats;
}

/**
 * Parse Playwright HTML report
 * @param htmlPath Path to the report index.html file
 * @returns Report statistics including test failures with file paths and line numbers
 */
export function parsePlaywrightReport(htmlPath: string): PlaywrightReportStats {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Try to extract __playwright data object
    const playwrightData = extractPlaywrightData(html);

    let stats: PlaywrightReportStats;

    if (playwrightData) {
      // Extract stats from data object
      const failures = parseFailuresFromData(playwrightData);

      stats = {
        total: 0,
        passed: 0,
        failed: failures.length,
        skipped: 0,
        duration: 0,
        failures
      };

      // Calculate totals from suites
      if (playwrightData.suites) {
        for (const suite of playwrightData.suites) {
          if (!suite.specs) continue;

          for (const spec of suite.specs) {
            if (!spec.tests) continue;

            for (const test of spec.tests) {
              stats.total++;
              if (test.status === 'passed') stats.passed++;
              else if (test.status === 'skipped') stats.skipped++;

              if (test.duration) {
                stats.duration += test.duration;
              }
            }
          }
        }
      }
    } else {
      // Fallback to HTML parsing
      const htmlStats = parseStatsFromHtml($);
      stats = {
        ...htmlStats,
        failures: [] // Can't extract detailed failures from HTML alone
      };
    }

    return stats;
  } catch (error) {
    console.error('Error parsing report:', htmlPath, error);
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: []
    };
  }
}
