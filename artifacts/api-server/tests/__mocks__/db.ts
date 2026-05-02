// Test stub for @workspace/db. Aliased into the test bundle via vitest.config.ts.
// Only the surface used by routes/auth.ts is implemented as real behavior; other
// table exports are present as inert proxies so unrelated route imports don't blow up.

type AnyRow = Record<string, unknown>;

interface FakeStore {
  byEmail: Map<string, AnyRow>;
  byId: Map<string, AnyRow>;
  nextId: number;
}

const store: FakeStore = { byEmail: new Map(), byId: new Map(), nextId: 1 };

export function __resetDb() {
  store.byEmail.clear();
  store.byId.clear();
  store.nextId = 1;
}

export function __seedUser(row: AnyRow) {
  const id = (row["id"] as string) ?? `u${store.nextId++}`;
  const r: AnyRow = { id, emailVerified: false, ...row };
  store.byEmail.set(String(r["email"]).toLowerCase(), r);
  store.byId.set(String(r["id"]), r);
  return r;
}

export function __getUserByEmail(email: string) {
  return store.byEmail.get(email.toLowerCase());
}

const tableProxy = new Proxy(
  {},
  { get: (_t, prop) => ({ __col: String(prop) }) },
);

export const usersTable = tableProxy as Record<string, { __col: string }>;
export const verificationCodesTable = tableProxy as Record<string, { __col: string }>;
export const sessionsTable = tableProxy as unknown;
export const dailyContentTable = tableProxy as unknown;
export const referralsTable = tableProxy as unknown;
export const referralRedemptionsTable = tableProxy as unknown;
export const referralRewardsTable = tableProxy as unknown;
export const pushTokensTable = tableProxy as unknown;
export const notificationPreferencesTable = tableProxy as unknown;
export const userProfilesTable = tableProxy as unknown;
export const pool = {} as unknown;
export type UserProfile = AnyRow;
export type NotificationPreference = AnyRow;

interface CondLike {
  __col?: string;
  __val?: unknown;
}

function condCol(c: unknown): { col: string; val: unknown } | null {
  const cl = c as CondLike;
  if (cl && typeof cl === "object" && typeof cl.__col === "string") {
    return { col: cl.__col, val: cl.__val };
  }
  return null;
}

function makeSelect() {
  let _email: string | undefined;
  let _id: string | undefined;
  const builder: Record<string, (...a: unknown[]) => unknown> = {
    from: () => builder,
    where: (cond: unknown) => {
      const c = condCol(cond);
      if (c?.col === "email") _email = String(c.val).toLowerCase();
      if (c?.col === "id") _id = String(c.val);
      return builder;
    },
    orderBy: () => builder,
    limit: () => {
      const out: AnyRow[] = [];
      if (_email && store.byEmail.has(_email)) out.push(store.byEmail.get(_email)!);
      if (_id && store.byId.has(_id)) out.push(store.byId.get(_id)!);
      return Promise.resolve(out);
    },
  };
  return builder;
}

function makeInsert() {
  let _values: AnyRow = {};
  const builder = {
    values(v: AnyRow) {
      _values = v;
      return builder as unknown as { returning(): Promise<AnyRow[]> } & PromiseLike<unknown>;
    },
    returning() {
      const id = `u${store.nextId++}`;
      const row: AnyRow = { id, emailVerified: false, ..._values };
      store.byEmail.set(String(row["email"]).toLowerCase(), row);
      store.byId.set(id, row);
      return Promise.resolve([row]);
    },
    then(onFulfilled: (v: unknown) => unknown) {
      return Promise.resolve(undefined).then(onFulfilled);
    },
  };
  return builder;
}

function makeUpdate() {
  let _set: AnyRow = {};
  const builder = {
    set(v: AnyRow) {
      _set = v;
      return builder;
    },
    where(cond: unknown) {
      const c = condCol(cond);
      if (c?.col === "id" && store.byId.has(String(c.val))) {
        Object.assign(store.byId.get(String(c.val))!, _set);
      }
      return Promise.resolve();
    },
  };
  return builder;
}

export const db = {
  select: () => makeSelect(),
  insert: (_t: unknown) => makeInsert(),
  update: (_t: unknown) => makeUpdate(),
};
