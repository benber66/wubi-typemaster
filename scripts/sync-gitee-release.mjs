#!/usr/bin/env node
/**
 * Sync GitHub Release assets to Gitee Release
 *
 * Required env:
 *   GITEE_TOKEN  - Gitee personal access token
 *   TAG_NAME     - e.g. v0.0.1
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = join(__dirname, '..', 'dist-artifacts');

const REPO_OWNER = 'benber66';
const REPO_NAME = 'wubi-typemaster';
const GITEE_OWNER = 'benber66';
const GITEE_REPO = 'wubi-typemaster';

async function findAssets() {
  try {
    await stat(ARTIFACTS_DIR);
  } catch {
    console.log(`No artifacts directory at ${ARTIFACTS_DIR}, skipping`);
    return [];
  }

  const allFiles = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else {
        allFiles.push(full);
      }
    }
  }
  await walk(ARTIFACTS_DIR);
  return allFiles;
}

async function giteeApi(path, options = {}) {
  const url = `https://gitee.com/api/v5${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gitee API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  const token = process.env.GITEE_TOKEN;
  const tag = process.env.TAG_NAME;
  if (!token) throw new Error('GITEE_TOKEN not set');
  if (!tag) throw new Error('TAG_NAME not set');

  console.log(`Syncing release ${tag} to Gitee...`);

  // 1. Find existing release by tag
  const releases = await giteeApi(
    `/repos/${GITEE_OWNER}/${GITEE_REPO}/releases?access_token=${token}`,
  );
  let release = releases.find((r) => r.tag_name === tag);

  // 2. Create if not exists
  if (!release) {
    console.log(`Release ${tag} not found, creating...`);
    release = await giteeApi(
      `/repos/${GITEE_OWNER}/${GITEE_REPO}/releases?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_name: tag,
          name: tag,
          body: `Mirrored from https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`,
        }),
      },
    );
  }

  console.log(`Release ID: ${release.id}`);

  // 3. Upload assets
  const assets = await findAssets();
  console.log(`Found ${assets.length} assets to upload`);

  for (const filepath of assets) {
    const filename = filepath.split(/[\\/]/).pop();
    console.log(`  Uploading ${filename}...`);
    const data = await readFile(filepath);
    const form = new FormData();
    form.append('access_token', token);
    form.append('file', new Blob([data]), filename);

    const res = await fetch(
      `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/releases/${release.id}/attach_files?access_token=${token}`,
      { method: 'POST', body: form },
    );
    if (!res.ok) {
      console.error(`    FAILED: ${res.status}`);
      continue;
    }
    console.log(`    OK`);
  }

  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
