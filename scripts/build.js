#!/usr/bin/env node

/**
 * Cross-platform build script for Next.js.
 *
 * Works on Windows, macOS, and Linux — uses only Node.js APIs
 * (no bash-specific commands like `if [ -d ]` or `cp -r`).
 *
 * Supports two output modes controlled by next.config.ts:
 *   - output: "export"  → generates `out/` directory (Capacitor mobile)
 *   - output: "standalone" → generates `.next/standalone/` (web deployment)
 *
 * When output is "export", API routes and dynamic [slug] routes are
 * temporarily moved aside (they require a server and can't be statically
 * exported), then restored after the build completes.
 *
 * After `next build`, this script:
 *   1. If `.next/standalone` exists, copies `.next/static` and `public`
 *      into it so the standalone server can serve static assets.
 *   2. Logs which output mode was detected.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const appDir = path.join(projectRoot, "src", "app");
const backupDir = path.join(projectRoot, ".build-backup");

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read the output mode from next.config.ts
 */
function getOutputMode() {
  const configPath = path.join(projectRoot, "next.config.ts");
  const content = fs.readFileSync(configPath, "utf-8");
  const match = content.match(/output:\s*["'](\w+)["']/);
  return match ? match[1] : null;
}

/**
 * Move directories that conflict with static export to a backup location.
 * Returns an array of { original, backup } for restoration.
 */
function moveAsideForExport() {
  const moved = [];

  // 1. Move the entire api directory
  const apiDir = path.join(appDir, "api");
  if (fs.existsSync(apiDir)) {
    const backup = path.join(backupDir, "api");
    fs.mkdirSync(backupDir, { recursive: true });
    fs.renameSync(apiDir, backup);
    moved.push({ original: apiDir, backup });
    console.log(`[build] Moved aside: ${path.relative(projectRoot, apiDir)}`);
  }

  // 2. Move dynamic [slug] directories recursively
  moveDynamicRoutes(appDir, moved);

  return moved;
}

/**
 * Recursively find and move [slug] directories.
 */
function moveDynamicRoutes(dir, moved) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith("[") && entry.name.endsWith("]")) {
      const original = path.join(dir, entry.name);
      const relativePath = path.relative(projectRoot, original);
      const backup = path.join(backupDir, relativePath.replace(/\//g, "_").replace(/\\/g, "_"));
      fs.mkdirSync(backupDir, { recursive: true });
      fs.renameSync(original, backup);
      moved.push({ original, backup });
      console.log(`[build] Moved aside: ${relativePath}`);
    } else if (entry.isDirectory() && entry.name !== "api") {
      // Recurse into subdirectories (but not api, already handled)
      moveDynamicRoutes(path.join(dir, entry.name), moved);
    }
  }
}

/**
 * Restore moved directories to their original locations.
 */
function restoreMoved(moved) {
  // Restore in reverse order to handle nested paths
  for (const { original, backup } of moved.reverse()) {
    try {
      if (fs.existsSync(backup)) {
        // Ensure parent directory exists
        fs.mkdirSync(path.dirname(original), { recursive: true });
        fs.renameSync(backup, original);
        console.log(`[build] Restored: ${path.relative(projectRoot, original)}`);
      }
    } catch (err) {
      console.error(`[build] Failed to restore ${original}:`, err.message);
    }
  }

  // Clean up backup directory
  try {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

/**
 * Recursively count files in a directory, optionally filtering by extension.
 */
function countFilesRecursive(dir, ext) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFilesRecursive(fullPath, ext);
      } else if (!ext || entry.name.endsWith(ext)) {
        count++;
      }
    }
  } catch {
    // ignore permission errors
  }
  return count;
}

// ── Main Build ──────────────────────────────────────────────────────────────

const outputMode = getOutputMode();
console.log(`[build] Output mode: ${outputMode || "(default)"}`);

let movedItems = [];

// If output is "export", temporarily move API routes and dynamic routes aside
if (outputMode === "export") {
  console.log("[build] Export mode — moving API routes and dynamic routes aside...");
  movedItems = moveAsideForExport();
}

// Run next build
try {
  console.log("[build] Running next build...");
  execSync("next build", { stdio: "inherit", cwd: projectRoot });
  console.log("[build] next build completed.");
} catch (err) {
  // Restore moved items even if build fails
  if (movedItems.length > 0) {
    console.log("[build] Build failed — restoring moved files...");
    restoreMoved(movedItems);
  }
  process.exit(1);
}

// Restore moved items
if (movedItems.length > 0) {
  console.log("[build] Restoring moved files...");
  restoreMoved(movedItems);
}

// ── Post-build — copy static assets for standalone mode ─────────────────────

const standaloneDir = path.join(projectRoot, ".next", "standalone");

if (fs.existsSync(standaloneDir)) {
  console.log("[build] Standalone output detected — copying static assets...");

  const sources = [
    {
      src: path.join(projectRoot, ".next", "static"),
      dest: path.join(standaloneDir, ".next", "static"),
      label: ".next/static → .next/standalone/.next/static",
    },
    {
      src: path.join(projectRoot, "public"),
      dest: path.join(standaloneDir, "public"),
      label: "public → .next/standalone/public",
    },
  ];

  for (const { src, dest, label } of sources) {
    if (!fs.existsSync(src)) {
      console.warn(`[build] Source not found, skipping: ${src}`);
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(src, dest, { recursive: true, force: true });
      console.log(`[build] Copied ${label}`);
    } catch (err) {
      console.error(`[build] Failed to copy ${label}:`, err.message);
      process.exitCode = 1;
    }
  }
}

// ── Verify output ───────────────────────────────────────────────────────────

const outDir = path.join(projectRoot, "out");

if (fs.existsSync(outDir)) {
  const htmlFiles = countFilesRecursive(outDir, ".html");
  const totalFiles = countFilesRecursive(outDir);
  console.log(`[build] Export output detected — 'out' directory has ${totalFiles} files (${htmlFiles} HTML pages).`);
} else if (fs.existsSync(standaloneDir)) {
  console.log("[build] Standalone output verified — .next/standalone/server.js ready.");
} else {
  console.warn("[build] No 'out' or '.next/standalone' directory found. Check next.config.ts output setting.");
}

console.log("[build] Done.");
