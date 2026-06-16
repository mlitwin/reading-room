// Generic invariant runner. Each invariant is a plain object:
//
//   { id, description, check(data, ctx) -> Violation[] }
//
// A Violation is { path: string, message: string, sample?: unknown }.
// Empty array = pass. Throwing from check() is a framework bug, not a violation.

/**
 * @typedef {{ path: string, message: string, sample?: unknown }} Violation
 * @typedef {{
 *   id: string,
 *   description: string,
 *   check: (data: any, ctx: Record<string, any>) => Violation[]
 * }} Invariant
 * @typedef {{
 *   suite: string,
 *   passed: boolean,
 *   invariants: Array<{
 *     id: string,
 *     description: string,
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
      passed: violations.length === 0,
      violations,
    };
  });
  return {
    suite,
    passed: results.every((r) => r.passed),
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
  const verdict = report.passed ? 'PASS' : 'FAIL';
  lines.push(`[${verdict}] suite=${report.suite}`);
  for (const inv of report.invariants) {
    const mark = inv.passed ? '✓' : '✗';
    const count = inv.violations.length;
    const suffix = inv.passed ? '' : `  (${count} violation${count === 1 ? '' : 's'})`;
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
