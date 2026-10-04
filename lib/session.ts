import { query } from "@/lib/db";
import type { Session } from "@/types/api";

export async function getSession(): Promise<Session> {
  try {
    const res = await query(
      "SELECT id, pseudo FROM utilisateurs WHERE LOWER(pseudo) = 'cinephile_92' LIMIT 1;"
    );
    if (res.rows.length > 0) {
      const u = res.rows[0];
      return {
        user: {
          id: String(u.id),
          pseudo: u.pseudo,
          email: `${u.pseudo}@filmbox.cinema`,
          avatarUrl: "",
        },
      };
    }
  } catch (err) {
    console.warn("[session] DB lookup error:", err);
  }

  return {
    user: {
      id: "1",
      pseudo: "cinephile_92",
      email: "cinephile_92@filmbox.cinema",
      avatarUrl: "",
    },
  };
}
