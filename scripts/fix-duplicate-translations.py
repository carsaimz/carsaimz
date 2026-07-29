#!/usr/bin/env python3
"""
Fix duplicate top-level sections in translation files.

The files de-de.ts, es-es.ts, fr-fr.ts, zh-cn.ts have duplicated
sections (nav, auth, common, home, services, projects, blog, forum,
dashboard, admin, partner, financial, footer). The second occurrence
overwrites the first in JavaScript, losing keys like signInWithGithub
that exist only in the first occurrence.

Strategy: Remove the second occurrence of each duplicate section,
keeping the first (which has signInWithGithub) and the unique
sections after the duplicate block (contact, faq, about, etc.).
"""

import re
import os

TRANSLATIONS_DIR = '/home/z/my-project/src/lib/translations'
AFFECTED_FILES = ['de-de.ts', 'es-es.ts', 'fr-fr.ts', 'zh-cn.ts']

# Sections that appear twice (first set at lines ~13-620, second at ~626-1220)
DUPLICATE_SECTIONS = [
    'nav', 'auth', 'common', 'home', 'services', 'projects',
    'blog', 'forum', 'dashboard', 'admin', 'partner', 'financial', 'footer'
]


def find_top_level_sections(lines):
    """Find all top-level section starts (indent=2, key: { pattern)."""
    sections = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.endswith('{') and not stripped.startswith('//') and not stripped.startswith('*'):
            indent = len(line) - len(line.lstrip())
            if indent == 2:
                key = stripped.split(':')[0].strip()
                sections.append((i, key))  # 0-indexed
    return sections


def find_section_end(lines, start_idx):
    """Find the closing brace of a section starting at start_idx."""
    brace_count = 0
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0 and i > start_idx:
            # The closing brace is at line i
            # Find the next non-empty line after the closing brace
            return i
    return len(lines) - 1


def fix_file(filepath):
    """Remove duplicate sections from a translation file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()

    sections = find_top_level_sections(lines)

    # Find the indices of duplicate sections
    seen = {}
    duplicates = []
    for idx, key in sections:
        if key in seen:
            duplicates.append((idx, key, seen[key]))
        else:
            seen[key] = idx

    if not duplicates:
        print(f"  No duplicates found in {os.path.basename(filepath)}")
        return

    # Find the range of the duplicate block
    # The duplicate block starts at the second nav section and ends at the second footer section
    dup_start = None
    dup_end = None

    for idx, key, first_idx in duplicates:
        if key == 'nav' and dup_start is None:
            # Include any comment lines before the second nav
            # Look backwards for comment lines
            start = idx
            while start > 0 and (lines[start - 1].strip().startswith('//') or lines[start - 1].strip() == ''):
                start -= 1
            dup_start = start
        if key == 'footer':
            dup_end = find_section_end(lines, idx)

    if dup_start is None or dup_end is None:
        print(f"  Could not find duplicate block boundaries in {os.path.basename(filepath)}")
        return

    # Also remove trailing blank lines after the duplicate block
    while dup_end + 1 < len(lines) and lines[dup_end + 1].strip() == '':
        dup_end += 1

    # Also remove any leading blank lines before the duplicate block that are part of the separator
    while dup_start > 0 and lines[dup_start - 1].strip() == '':
        dup_start -= 1

    # Remove the duplicate block
    new_lines = lines[:dup_start] + lines[dup_end + 1:]

    # Write back
    with open(filepath, 'w') as f:
        f.writelines(new_lines)

    removed = dup_end - dup_start + 1
    print(f"  Removed {removed} lines (duplicate block) from {os.path.basename(filepath)}")
    print(f"  File size: {len(lines)} -> {len(new_lines)} lines")


def main():
    for filename in AFFECTED_FILES:
        filepath = os.path.join(TRANSLATIONS_DIR, filename)
        print(f"Processing {filename}...")
        fix_file(filepath)


if __name__ == '__main__':
    main()
