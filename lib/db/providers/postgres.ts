import type { DBClient, ListOptions } from '@/lib/db/types';
import { Pool, type PoolClient } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const maxConnections = Number(process.env.DB_MAX_CONNECTIONS || 10);
  const idleTimeoutMs = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
  const connectionTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  const sslConfig =
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined;

  if (url) {
    pool = new Pool({
      connectionString: url,
      ssl: sslConfig,
      max: maxConnections,
      idleTimeoutMillis: idleTimeoutMs,
      connectionTimeoutMillis: connectionTimeoutMs,
    });
  } else {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT || 5432);
    const database = process.env.DB_DATABASE || '';
    const user = process.env.DB_USERNAME || '';
    const password = process.env.DB_PASSWORD || '';
    pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: sslConfig,
      max: maxConnections,
      idleTimeoutMillis: idleTimeoutMs,
      connectionTimeoutMillis: connectionTimeoutMs,
    });
  }
  return pool;
}

function buildWhereClause(
  filters: Record<string, unknown>,
  startIndex = 1
): { clause: string; values: unknown[] } {
  const keys = Object.keys(filters);
  if (keys.length === 0) return { clause: '', values: [] };
  const parts = keys.map((k, i) => `${k} = $${startIndex + i}`);
  const values = keys.map(k => filters[k]);
  return { clause: ' WHERE ' + parts.join(' AND '), values };
}

function buildOrderAndLimit(options?: ListOptions): string {
  let sql = '';
  if (options?.orderBy) {
    sql += ` ORDER BY ${options.orderBy.column} ${options.orderBy.ascending === false ? 'DESC' : 'ASC'}`;
  }
  if (options?.limit) {
    sql += ` LIMIT ${options.limit}`;
    if (options.offset) sql += ` OFFSET ${options.offset}`;
  }
  return sql;
}

function buildPostgresClient(exec: Pool | PoolClient): DBClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (sql: string, params?: unknown[]) =>
    (exec as any).query(sql, params) as Promise<{ rows: never[] }>;

  const client: DBClient = {
    async list(table, options) {
      const sql = `SELECT * FROM ${table}` + buildOrderAndLimit(options);
      const { rows } = await q(sql);
      return rows;
    },

    async insert(table, data) {
      const keys = Object.keys(data);
      const cols = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => (data as Record<string, unknown>)[k]);
      const { rows } = await q(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return rows[0] as never;
    },

    async getById(table, id) {
      const { rows } = await q(`SELECT * FROM ${table} WHERE id = $1 LIMIT 1`, [id]);
      return rows[0] ?? null;
    },

    async updateById(table, id, update) {
      const keys = Object.keys(update);
      if (keys.length === 0) throw new Error('No fields to update');
      const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map(k => (update as Record<string, unknown>)[k]);
      const { rows } = await q(
        `UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
      );
      return rows[0] as never;
    },

    async deleteById(table, id) {
      await q(`DELETE FROM ${table} WHERE id = $1`, [id]);
    },

    async deleteWhere(table, filters) {
      const { clause, values } = buildWhereClause(filters);
      await q(`DELETE FROM ${table}${clause}`, values);
    },

    async findWhere(table, filters, options) {
      const { clause, values } = buildWhereClause(filters);
      const sql = `SELECT * FROM ${table}${clause}` + buildOrderAndLimit(options);
      const { rows } = await q(sql, values);
      return rows;
    },

    async findOne(table, filters) {
      const { clause, values } = buildWhereClause(filters);
      const sql = `SELECT * FROM ${table}${clause} LIMIT 1`;
      const { rows } = await q(sql, values);
      return rows[0] ?? null;
    },

    async count(table, filters) {
      const { clause, values } = buildWhereClause(filters ?? {});
      const sql = `SELECT COUNT(*)::int AS total FROM ${table}${clause}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { rows } = (await q(sql, values)) as any;
      return (rows as Array<{ total: number }>)[0]?.total ?? 0;
    },

    async insertMany(table, dataArr) {
      if (dataArr.length === 0) return [];
      const keys = Object.keys(dataArr[0]!);
      const cols = keys.join(', ');
      const allValues: unknown[] = [];
      const rowPlaceholders: string[] = [];
      let idx = 1;
      for (const row of dataArr) {
        const ph = keys.map(() => `$${idx++}`).join(', ');
        rowPlaceholders.push(`(${ph})`);
        keys.forEach(k => allValues.push((row as Record<string, unknown>)[k]));
      }
      const sql = `INSERT INTO ${table} (${cols}) VALUES ${rowPlaceholders.join(', ')} RETURNING *`;
      const { rows } = await q(sql, allValues);
      return rows;
    },

    async upsert(table, data, conflictKeys) {
      const keys = Object.keys(data);
      const cols = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => (data as Record<string, unknown>)[k]);
      const conflict = conflictKeys && conflictKeys.length > 0 ? conflictKeys.join(', ') : 'id';
      const updates = keys
        .filter(k => !conflictKeys?.includes(k))
        .map(k => `${k} = EXCLUDED.${k}`)
        .join(', ');
      const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflict}) DO UPDATE SET ${updates} RETURNING *`;
      const { rows } = await q(sql, values);
      return rows[0] as never;
    },

    async query(sql, params) {
      const { rows } = await q(sql, params);
      return rows;
    },

    async transaction<T>(fn: (tx: DBClient) => Promise<T>): Promise<T> {
      const pgClient = await getPool().connect();
      await pgClient.query('BEGIN');
      try {
        const txClient = buildPostgresClient(pgClient);
        const result = await fn(txClient);
        await pgClient.query('COMMIT');
        return result;
      } catch (err) {
        await pgClient.query('ROLLBACK');
        throw err;
      } finally {
        pgClient.release();
      }
    },
  };

  return client;
}

export function createPostgresDB(): DBClient {
  return buildPostgresClient(getPool());
}
