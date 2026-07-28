#!/usr/bin/env node

/**
 * Post-build script for Next.js standalone output.
 * Copies `.next/static` and `public` into the `.next/standalone` directory
 * so that the standalone server can serve static assets correctly.
 *
 * This replaces the bash-specific `cp -r` command that fails on Windows.
 * Uses Node.js APIs for full cross-platform compatibility.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const standaloneDir = path.join(projectRoot, ".next", "standalone");

// Check if standalone output exists — it only exists when `output: "standalone"`
// is set in next.config.ts. If it's missing, there's nothing to do.
if (!fs.existsSync(standaloneDir)) {
  console.log("[post-build] .next/standalone not found — skipping copy steps.");
  process.exit(0);
}

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
    console.warn(`[post-build] Source not found, skipping: ${src}`);
    continue;
  }

  try {
    // Ensure the parent directory of dest exists
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    // Use fs.cpSync (Node 16.7+) for recursive directory copy
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`[post-build] Copied ${label}`);
  } catch (err) {
    console.error(`[post-build] Failed to copy ${label}:`, err.message);
    process.exitCode = 1;
  }
}

console.log("[post-build] Done.");
