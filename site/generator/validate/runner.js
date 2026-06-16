// Generic invariant runner. Each invariant is a plain object:
//
//   { id, description, severity, check(data, ctx) -> Violation[] }
//
// severity: 'error' | 'warning'. Defaults to 'error' if omitted.
// - error:   structural problem; build gate fails. Examples: duplicate ids,
//            paradigm.type inconsistent with pos, dropped markdown spans.
// - warning: editorial-backlog quality issue surfaced for tracking but not
//            blocking. Examples: stub lemmata with incomplete paradigms,
//            tokens whose surface isn't in the glossary yet.
//
// A Violation is { path: string, message: string, sample?: unknown }.
// Empty array = pass. Throwing from check() is a framework bug, not a violation.

/**
 * @typedef {'error' | 'warning'} Severity
 * @typedef {{ path: string, message: string, sample?: unknown }} Violation
 * @typedef {{
 *   id: string,
 *   description: string,
 *   severity?: Severity,
 *   check: (data: any, ctx: Record<string, any>) => Violation[]
 * }} Invariant
 * @typedef {{
 *   suite: string,
 *   passed: boolean,
 *   hasErrors: boolean,
 *   hasWarnings: boolean,
 *   invariants: Array<{
 *     id: string,
 *     description: string,
 *     severity: Severity,
 *     passed: boolean,
 *     violations: Violation[],
 *   }>,
 * }} SuiteReport
 */

/**
 * @param {string} suite
 * @param {Invariant[]} invariants
 * @param {any} data
 * @param {Record<string, any>} [ctx]
 * @returns {SuiteReport}
 */
export function runSuite(suite, invariants, data, ctx = {}) {
  const results = invariants.map((inv) => {
    const violations = inv.check(data, ctx) ?? [];
    return {
      id: inv.id,
      description: inv.description,
      severity: inv.severity ?? 'error',
      passed: violations.length === 0,
      violations,
    };
  });
  const hasErrors = results.some((r) => !r.passed && r.severity === 'error');
  const hasWarnings = results.some((r) => !r.passed && r.severity === 'warning');
  return {
    suite,
    passed: results.every((r) => r.passed),
    hasErrors,
    hasWarnings,
    invariants: results,
  };
}

/**
 * Render a SuiteReport as a human-readable string.
 * Shows the first N violations per failing invariant; full count noted in the header.
 * @param {SuiteReport} report
 * @param {{ maxExamples?: number }} [opts]
 */
export function formatReport(report, opts = {}) {
  const maxExamples = opts.maxExamples ?? 5;
  const lines = [];
  const verdict = report.hasErrors ? 'FAIL' : (report.hasWarnings ? 'WARN' : 'PASS');
  lines.push(`[${verdict}] suite=${report.suite}`);
  for (const inv of report.invariants) {
    const mark = inv.passed ? '✓' : (inv.severity === 'error' ? '✗' : '!');
    const count = inv.violations.length;
    const sev = inv.severity === 'warning' ? ' (warning)' : '';
    const suffix = inv.passed ? '' : `  (${count} violation${count === 1 ? '' : 's'})${sev}`;
    lines.push(`  ${mark} [${inv.id}] ${inv.description}${suffix}`);
    if (!inv.passed) {
      for (const v of inv.violations.slice(0, maxExamples)) {
        lines.push(`      ${v.path}: ${v.message}`);
      }
      if (count > maxExamples) {
        lines.push(`      … and ${count - maxExamples} more`);
      }
    }
  }
  return lines.join('\n');
}
