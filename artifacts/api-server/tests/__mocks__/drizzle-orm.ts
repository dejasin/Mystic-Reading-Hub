// Test stub for drizzle-orm helpers used by the routes under test.
// Returns marker objects that pair with the column proxies in __mocks__/db.ts.

interface ColMarker { __col?: string }

export function eq(col: ColMarker, val: unknown) {
  return { __col: col?.__col, __val: val };
}

export function and(...conds: unknown[]) {
  // For our auth happy-path the user lookup is `eq(email)` only; the verify-code
  // route uses `and()` but isn't exercised by these tests. Return the first
  // marker so eq-based extraction still works for single-condition lookups.
  return conds[0];
}

export function gt(_col: ColMarker, _val: unknown) {
  return { __col: "_gt_", __val: _val };
}

export function desc<T>(c: T): T {
  return c;
}

export function asc<T>(c: T): T {
  return c;
}

export function sql(strings: TemplateStringsArray, ..._values: unknown[]) {
  return { __sql: strings.join("?") };
}

sql.raw = (s: string) => ({ __sql: s });

export const inArray = (_c: unknown, _v: unknown) => ({ __op: "inArray" });
export const isNull = (_c: unknown) => ({ __op: "isNull" });
export const isNotNull = (_c: unknown) => ({ __op: "isNotNull" });
export const lt = (_c: unknown, _v: unknown) => ({ __op: "lt" });
export const gte = (_c: unknown, _v: unknown) => ({ __op: "gte" });
export const lte = (_c: unknown, _v: unknown) => ({ __op: "lte" });
export const ne = (_c: unknown, _v: unknown) => ({ __op: "ne" });
export const or = (...c: unknown[]) => c[0];
