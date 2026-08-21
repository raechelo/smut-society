'use server';

import { randomUUID } from 'node:crypto';
import { auth } from '@/auth';

// Allowed image types → file extension. SVG is intentionally excluded.
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Commit an uploaded image to the public GitHub assets repo and return its raw
// URL. Reads the repo ("owner/name") and a write-scoped token from env, so no
// secrets live in code. Signed-in users only.
export async function uploadQuizAsset(
  formData: FormData
): Promise<{ url: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const repo = process.env.GITHUB_ASSETS_REPO;
  const token = process.env.GITHUB_ASSETS_TOKEN;
  if (!repo || !token) {
    throw new Error('Image uploads are not configured');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('No image was provided');

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error('Use a PNG, JPEG, GIF, or WebP image');
  if (file.size > MAX_BYTES) throw new Error('Image must be 5 MB or smaller');

  const content = Buffer.from(await file.arrayBuffer()).toString('base64');
  const path = `outcomes/${randomUUID()}.${ext}`;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: `Add quiz asset ${path}`, content }),
    }
  );

  if (!res.ok) {
    console.error('GitHub asset upload failed', res.status, await res.text());
    throw new Error('Could not upload the image. Try again.');
  }

  const data = (await res.json()) as { content?: { download_url?: string } };
  const url = data.content?.download_url;
  if (!url) throw new Error('Upload succeeded but no URL was returned');

  return { url };
}
