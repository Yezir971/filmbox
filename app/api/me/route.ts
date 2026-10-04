import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query("SELECT id, pseudo FROM utilisateurs WHERE pseudo = 'cinephile_92' LIMIT 1;");
    if (res.rows.length > 0) {
      const user = res.rows[0];
      return NextResponse.json({
        user: {
          id: String(user.id),
          pseudo: user.pseudo,
          email: `${user.pseudo}@filmbox.cinema`,
          avatarUrl: "",
        },
      });
    }
  } catch (err) {
    // Fallback gracieux
  }

  return NextResponse.json({
    user: {
      id: "1",
      pseudo: "cinephile_92",
      email: "cinephile_92@filmbox.cinema",
      avatarUrl: "",
    },
  });
}
