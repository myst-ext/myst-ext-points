/**
 * Extension for adding up points in an assignment.
 *
 * No more need to stress that point totals don't add up!! 😰
 *
 * Defines one role:
 *
 *   - `points` displays points and records number in total
 *
 * And one directives:
 *
 *  - `pointreport` displays a total of points and bonus points for the current document
 *
 * For example:
 *
 * ```markdown
 * # Assignment
 *
 * :::{pointreport}
 * :::
 *
 * - Task 1: {points}`2`
 * - Task 2: {points}`2 bonus`
 * - Task 3: {points}`1`
 * ```
 *
 * Which creates:
 *
 * **Total points:** 3 (+ 2 bonus points)
 *
 * - Task 1: **(2 points)**
 * - Task 2: **(2 bonus points)**
 * - Task 3: **(1 point)**
 *
 * ---
 *
 * Based upon minrk's `taskpoint.py` Sphinx plugin:
 * https://gist.github.com/minrk/2234020a647643ae88c63b20d3008e0b
 */

const KNOWN_CATEGORIES = ['all', 'bonus'];

const pointReportDirective = {
  name: 'pointreport',
  doc: 'Report all of the points in a document.',
  run() {
    // Leave a paragraph of a special kind that we will process later in a transform.
    return [{ type: 'paragraph', kind: 'point-report' }];
  },
};

const pointsRole = {
  name: 'points',
  body: { type: String, required: true },
  run(data) {
    const [_points, category] = data.body.split(/\s/);
    const points = Number.parseInt(_points, 10);
    if (!_points || isNaN(points)) {
      console.error(`Points must be an integer, received: "${_points}"`);
      return [];
    }
    if (category && !KNOWN_CATEGORIES.includes(category)) {
      console.warn(`Unknown point category "${category}"`);
    }
    return [{ type: 'strong', kind: 'points', points, category }];
  },
};

const pointsTransform = {
  name: 'points-transform',
  stage: 'document',
  doc: 'Add up all of the points in a document, and transform the `points` role and the `point-report` to text.',
  plugin: (utils) => (tree) => {
    const totals = {};
    const points = utils.selectAll('strong[kind="points"]', tree);
    points.forEach((p) => {
      totals[p.category ?? 'all'] ??= 0; // initialize if it doesn't exist yet
      totals[p.category ?? 'all'] += p.points;
      // Modify the strong node in place
      p.children = [
        {
          type: 'text',
          value: `(${p.points} ${p.category ? `${p.category} ` : ''}point${
            p.points === 1 ? '' : 's'
          })`,
        },
      ];
    });
    const reports = utils.selectAll('paragraph[kind="point-report"]', tree);
    reports.forEach((r) => {
      r.totals = totals; // Store these for looking up across documents later!
      const extraPoints = Object.entries(totals).filter(([kind]) => kind !== 'all');
      const bonus = extraPoints.map(([k, p]) => `+ ${p} ${k} points`).join(', ');
      // Modify the paragraph node in place
      r.children = [
        { type: 'strong', children: [{ type: 'text', value: 'Total Points:' }] },
        { type: 'text', value: ` ${totals['all']}${bonus ? ` (${bonus})` : ''}` },
      ];
    });
  },
};

const plugin = {
  name: 'Points Extension',
  author: 'Rowan Cockett',
  license: 'MIT',
  directives: [pointReportDirective],
  roles: [pointsRole],
  transforms: [pointsTransform],
};

export default plugin;
