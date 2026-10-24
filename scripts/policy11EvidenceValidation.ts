/** Additive source fields also require review: a new event/batch/date field changes feasibility. */
export function validatePolicy11Headers(actual: string[], expected: string[], resource: string) {
  const missing = expected.filter(field => !actual.includes(field));
  const unexpected = actual.filter(field => !expected.includes(field));
  if (missing.length || unexpected.length) throw new Error(`Unreviewed ${resource} schema: missing [${missing.join(', ')}]; unexpected [${unexpected.join(', ')}]`);
}
