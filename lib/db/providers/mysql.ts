import type { DBClient, ListOptions } from '@/lib/db/types';
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  const maxConnections = Number(process.env.DB_MAX_CONNECTIONS || 10);
  const idleTimeoutMs = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
  const connectionTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
  const sslConfig =
    process.env.DB_SSL === 'true'
      ? ({
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        } as Record<string, unknown>)
      : undefined;

  const url = process.env.MYSQL_URL || '';
  if (url) {
    pool = mysql.createPool({
      uri: url,
      ssl: sslConfig,
      connectionLimit: maxConnections,
      idleTimeout: idleTimeoutMs,
      connectTimeout: connectionTimeoutMs,
    });
  } else {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT || 3306);
    const database = process.env.DB_DATABASE || '';
    const user = process.env.DB_USERNAME || '';
    const password = process.env.DB_PASSWORD || '';
    const socketPath = process.env.DB_SOCKET || '';
    pool = mysql.createPool({
      ...(socketPath ? { socketPath } : { host, port }),
      database,
      user,
      password,
      ssl: sslConfig,
      connectionLimit: maxConnections,
      idleTimeout: idleTimeoutMs,
      connectTimeout: connectionTimeoutMs,
    });
  }
  return pool;
}

/**
 * Builds a DBClient from a mysql2 Pool or PoolConnection.
 * Both share the same .query() API in mysql2/promise, allowing transparent
 * use in both regular and transactional contexts.
 */
function buildMySQLClient(exec: mysql.Pool | mysql.PoolConnection): DBClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (sql: string, params?: unknown[]) =>
    (exec as any).query(sql, params) as Promise<[unknown[], unknown[]]>;

  /** Convert ISO 8601 datetime strings to MySQL-compatible format. */
  function sanitizeParam(value: unknown): unknown {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return value
        .replace('T', ' ')
        .replace(/\.\d+Z?$/, '')
        .replace(/Z$/, '');
    }
    return value;
  }

  function buildWhereClause(filters: Record<string, unknown>): {
    clause: string;
    values: unknown[];
  } {
    const keys = Object.keys(filters);
    if (keys.length === 0) return { clause: '', values: [] };
    const parts = keys.map(k => `\`${k}\` = ?`);
    const values = keys.map(k => sanitizeParam(filters[k]));
    return { clause: ' WHERE ' + parts.join(' AND '), values };
  }

  function buildOrderAndLimit(options?: ListOptions): string {
    let sql = '';
    if (options?.orderBy) {
      sql += ` ORDER BY \`${options.orderBy.column}\` ${options.orderBy.ascending === false ? 'DESC' : 'ASC'}`;
    }
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) sql += ` OFFSET ${options.offset}`;
    }
    return sql;
  }

  const client: DBClient = {
    async list(table, options) {
      const sql = `SELECT * FROM \`${table}\`` + buildOrderAndLimit(options);
      const [rows] = await q(sql);
      return rows as never[];
    },

    async insert(table, data) {
      const keys = Object.keys(data);
      if (keys.length === 0) throw new Error('No fields to insert');
      const cols = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => `?`).join(', ');
      const values = keys.map(k => sanitizeParam((data as Record<string, unknown>)[k]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [result] = (await q(
        `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
        values
      )) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertedId = ((data as any).id ?? result?.insertId) as unknown;
      if (insertedId === null || insertedId === undefined) return data as never;
      const [after] = await q(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [insertedId]);
      const list = after as never[];
      return list[0] as never;
    },

    async getById(table, id) {
      const [rows] = await q(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
      const list = rows as never[];
      return list[0] ?? null;
    },

    async updateById(table, id, update) {
      const keys = Object.keys(update);
      if (keys.length === 0) throw new Error('No fields to update');
      const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => sanitizeParam((update as Record<string, unknown>)[k]));
      await q(`UPDATE \`${table}\` SET ${sets} WHERE id = ?`, [...values, id]);
      const [after] = await q(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
      const list = after as never[];
      return list[0] as never;
    },

    async deleteById(table, id) {
      await q(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    },

    async deleteWhere(table, filters) {
      const { clause, values } = buildWhereClause(filters);
      await q(`DELETE FROM \`${table}\`` + clause, values);
    },

    async findWhere(table, filters, options) {
      const { clause, values } = buildWhereClause(filters);
      const sql = `SELECT * FROM \`${table}\`` + clause + buildOrderAndLimit(options);
      const [rows] = await q(sql, values);
      return rows as never[];
    },

    async findOne(table, filters) {
      const { clause, values } = buildWhereClause(filters);
      const sql = `SELECT * FROM \`${table}\`` + clause + ' LIMIT 1';
      const [rows] = await q(sql, values);
      const list = rows as never[];
      return list[0] ?? null;
    },

    async count(table, filters) {
      const { clause, values } = buildWhereClause(filters ?? {});
      const sql = `SELECT COUNT(*) AS total FROM \`${table}\`` + clause;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [rows] = (await q(sql, values)) as any;
      return (rows as Array<{ total: number }>)[0]?.total ?? 0;
    },

    async insertMany(table, dataArr) {
      if (dataArr.length === 0) return [];
      const keys = Object.keys(dataArr[0]!);
      const cols = keys.map(k => `\`${k}\``).join(', ');
      const allValues: unknown[] = [];
      const rowPlaceholders: string[] = [];
      for (const row of dataArr) {
        rowPlaceholders.push(`(${keys.map(() => '?').join(', ')})`);
        keys.forEach(k => allValues.push(sanitizeParam((row as Record<string, unknown>)[k])));
      }
      await q(`INSERT INTO \`${table}\` (${cols}) VALUES ${rowPlaceholders.join(', ')}`, allValues);
      // MySQL doesn't support RETURNING *, so return input data as-is
      return dataArr as never[];
    },

    async upsert(table, data, conflictKeys) {
      const keys = Object.keys(data);
      if (keys.length === 0) throw new Error('No fields to upsert');
      const cols = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => sanitizeParam((data as Record<string, unknown>)[k]));
      const updates = keys
        .filter(k => !conflictKeys?.includes(k))
        .map(k => `\`${k}\` = VALUES(\`${k}\`)`)
        .join(', ');
      await q(
        `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (data as any).id;
      if (id) {
        const [after] = await q(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
        const list = after as never[];
        return list[0] ?? (data as never);
      }
      return data as never;
    },

    async query(sql, params) {
      const [rows] = await q(sql, params?.map(sanitizeParam));
      return rows as never[];
    },

    async transaction<T>(fn: (tx: DBClient) => Promise<T>): Promise<T> {
      const conn = await getPool().getConnection();
      await conn.beginTransaction();
      try {
        const txClient = buildMySQLClient(conn);
        const result = await fn(txClient);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  };

  return client;
}

export function createMySQLDB(): DBClient {
  return buildMySQLClient(getPool());
}
