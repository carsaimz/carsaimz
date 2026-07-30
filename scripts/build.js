#!/usr/bin/env node

/**
 * Cross-platform build script for Next.js.
 *
 * Works on Windows, macOS, and Linux — uses only Node.js APIs
 * (no bash-specific commands like `if [ -d ]` or `cp -r`).
 *
 * Supports three output modes controlled by BUILD_TARGET env var:
 *   - BUILD_TARGET=capacitor → output: "export" → generates `out/` directory
 *   - BUILD_TARGET=standalone → output: "standalone" → generates `.next/standalone/`
 *   - (default)              → output: undefined → generates `.next/` for server
 *
 * When output is "export", API routes and dynamic [slug]/[id] routes are
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
 * Determine build target from BUILD_TARGET env var.
 * Returns "capacitor", "standalone", or "" (default server mode).
 */
function getBuildTarget() {
  return process.env.BUILD_TARGET || "";
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

  // 2. Move dynamic [slug]/[id] directories that DON'T have generateStaticParams
  //    (pages with generateStaticParams are fine for static export)
  moveDynamicRoutesWithoutGSP(appDir, moved);

  return moved;
}

/**
 * Recursively find and move dynamic route directories that lack generateStaticParams.
 * Pages WITH generateStaticParams are kept (they work with static export).
 */
function moveDynamicRoutesWithoutGSP(dir, moved) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith("[") && entry.name.endsWith("]")) {
      const routeDir = path.join(dir, entry.name);
      const pageFile = path.join(routeDir, "page.tsx");

      // Check if this dynamic route has generateStaticParams
      let hasGSP = false;
      if (fs.existsSync(pageFile)) {
        const content = fs.readFileSync(pageFile, "utf-8");
        hasGSP = content.includes("generateStaticParams");
      }

      if (hasGSP) {
        console.log(`[build] Keeping dynamic route (has generateStaticParams): ${path.relative(projectRoot, routeDir)}`);
      } else {
        // Move it aside — no generateStaticParams means it can't be statically exported
        const original = routeDir;
        const relativePath = path.relative(projectRoot, original);
        const backup = path.join(backupDir, relativePath.replace(/\//g, "_").replace(/\\/g, "_"));
        fs.mkdirSync(backupDir, { recursive: true });
        fs.renameSync(original, backup);
        moved.push({ original, backup });
        console.log(`[build] Moved aside (no generateStaticParams): ${relativePath}`);
      }
    } else if (entry.isDirectory() && entry.name !== "api") {
      // Recurse into subdirectories (but not api, already handled)
      moveDynamicRoutesWithoutGSP(path.join(dir, entry.name), moved);
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

// ── Fix jose ESM issue ──────────────────────────────────────────────────────
// jwks-rsa v4 bundles jose v6 (ESM-only) as a nested dependency.
// This causes "require() of ES Module" errors on Vercel serverless.
// The fix: remove the nested jose v6 so jwks-rsa falls back to the
// top-level jose v4 (CJS-compatible), which has the same APIs.
const nestedJose = path.join(projectRoot, "node_modules", "jwks-rsa", "node_modules", "jose");
if (fs.existsSync(nestedJose)) {
  fs.rmSync(nestedJose, { recursive: true, force: true });
  console.log("[build] Removed nested jose v6 (ESM-only) — using top-level jose v4 (CJS)");
}

// ── Generate embedded Firebase credentials ──────────────────────────────────
// The firebase-admin-embedded.ts file is auto-generated from the obfuscated
// firebase-admin.json file. This must run before next build because the
// embedded credentials are imported by firebase-admin.ts.
const embedScript = path.join(projectRoot, "scripts", "embed-firebase-credentials.js");
const embeddedFile = path.join(projectRoot, "src", "lib", "firebase-admin-embedded.ts");
if (fs.existsSync(embedScript)) {
  try {
    console.log("[build] Generating embedded Firebase credentials...");
    execSync(`node "${embedScript}"`, { stdio: "inherit", cwd: projectRoot });
  } catch (err) {
    console.warn("[build] Embedded credentials generation failed (continuing with existing file):", err.message);
  }
} else if (!fs.existsSync(embeddedFile)) {
  console.warn("[build] WARNING: Neither embed script nor embedded credentials file found.");
  console.warn("[build] Firebase Admin may not initialize on Vercel without embedded credentials.");
}

// ── Main Build ──────────────────────────────────────────────────────────────

const buildTarget = getBuildTarget();
const isExport = buildTarget === "capacitor";
const isStandalone = buildTarget === "standalone";
const modeLabel = isExport ? "export (static)" : isStandalone ? "standalone (Electron)" : "default (server)";

console.log(`[build] BUILD_TARGET=${buildTarget || "(unset)"}`);
console.log(`[build] Output mode: ${modeLabel}`);

let movedItems = [];

// If output is "export", temporarily move API routes and dynamic routes aside
if (isExport) {
  console.log("[build] Export mode — moving API routes and dynamic routes without generateStaticParams aside...");
  movedItems = moveAsideForExport();
}

// Run next build
try {
  console.log("[build] Running next build...");
  execSync("npx next build", { stdio: "inherit", cwd: projectRoot });
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
