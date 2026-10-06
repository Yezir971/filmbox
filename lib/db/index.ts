import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.PGUSER || "filmbox_app"}:${process.env.PGPASSWORD || ""}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "filmbox"}`;

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[Database Pool Error]:", err);
    });
  }

  return pool;
}

/**
 * Obtient un client dédié du pool (à libérer impérativement avec client.release())
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Exécute une requête SQL paramétrée sur PostgreSQL
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const client = getPool();
  return client.query<R>(text, params);
}

/**
 * Exécute un bloc de requêtes dans une transaction ACID (BEGIN ... COMMIT).
 * En cas d'erreur dans le callback, un ROLLBACK automatique est exécuté
 * et l'erreur est propagée. La connexion est libérée dans tous les cas.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN;");
    const result = await callback(client);
    await client.query("COMMIT;");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK;");
    } catch (rollbackErr) {
      console.error("[Database Rollback Error]:", rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
}
