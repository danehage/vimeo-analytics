/**
 * SQL composer — internal to worker/src/queries/.
 *
 * Tracks bind parameters and emits Postgres $N placeholders. Callers
 * concatenate SQL strings and call push() for each user-supplied value.
 *
 * Usage:
 *   const c = composer();
 *   const sql = `SELECT * FROM sessions WHERE video_id = ${c.push(videoId)}`;
 *   return c.build(sql);  // → { sql, params }
 *
 * Invariants:
 * - User-supplied values never appear in the returned `sql` string.
 *   They live exclusively in `params`. The string contains only $N tokens.
 * - Placeholder index matches push() call order: first push returns $1, etc.
 */
export function composer() {
  const params = [];
  return {
    push(value) {
      params.push(value);
      return '$' + params.length;
    },
    build(sqlText) {
      return { sql: sqlText.trim().replace(/\s+/g, ' '), params };
    },
  };
}
