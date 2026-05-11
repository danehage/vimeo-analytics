/**
 * Query executor — the seam between the queries module and a neon SQL client.
 *
 * Queries are pure data: { sql, params }. This adapter is the only place
 * that calls the neon client. Routes import these instead of touching neon
 * directly.
 */
export async function run(sql, query) {
  return sql(query.sql, query.params);
}

export async function runMany(sql, queries) {
  return Promise.all(queries.map((q) => run(sql, q)));
}
