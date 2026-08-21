// Server-only helpers for the public GitHub assets repo. This is intentionally
// NOT a 'use server' module — these are internal utilities used by quiz actions,
// never exposed to the client as callable server actions.

const API = 'https://api.github.com';

function config() {
  const repo = process.env.GITHUB_ASSETS_REPO;
  const token = process.env.GITHUB_ASSETS_TOKEN;
  if (!repo || !token) return null;
  return { repo, token };
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

// Extract the repo-relative path from a raw asset URL, but only when it points
// at our configured repo — so cleanup can never touch files elsewhere.
function pathFromUrl(url: string, repo: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'raw.githubusercontent.com') return null;
  // pathname: /{owner}/{repo}/{branch}/{...path}
  const [owner, name, , ...rest] = parsed.pathname
    .replace(/^\//, '')
    .split('/');
  if (!owner || !name || rest.length === 0) return null;
  if (`${owner}/${name}` !== repo) return null;
  return rest.join('/');
}

// Best-effort delete of an uploaded asset by its raw URL. Never throws — a
// cleanup failure shouldn't break the quiz operation that triggered it.
export async function deleteAssetByUrl(url: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  const path = pathFromUrl(url, cfg.repo);
  if (!path) return;

  const endpoint = `${API}/repos/${cfg.repo}/contents/${path}`;
  try {
    // The Contents API needs the file's current sha to delete it.
    const meta = await fetch(endpoint, { headers: ghHeaders(cfg.token) });
    if (meta.status === 404) return; // already gone
    if (!meta.ok) {
      console.error('asset lookup failed', meta.status, await meta.text());
      return;
    }
    const data = (await meta.json()) as { sha?: string };
    if (!data.sha) return;

    const del = await fetch(endpoint, {
      method: 'DELETE',
      headers: ghHeaders(cfg.token),
      body: JSON.stringify({
        message: `Remove quiz asset ${path}`,
        sha: data.sha,
      }),
    });
    if (!del.ok) {
      console.error('asset delete failed', del.status, await del.text());
    }
  } catch (err) {
    console.error('asset delete error', err);
  }
}
