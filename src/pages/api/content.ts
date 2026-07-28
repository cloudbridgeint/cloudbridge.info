import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT key, value FROM content').all();
  const map: Record<string, string> = {};
  for (const row of results as any[]) map[row.key] = row.value;
  return new Response(JSON.stringify(map), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  let body: Record<string, string>;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const entries = Object.entries(body || {});
  for (const [key, value] of entries) {
    await db.prepare(
      `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(key, String(value)).run();
  }

  return new Response(JSON.stringify({ success: true, updated: entries.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
