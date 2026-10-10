#!/usr/bin/env python3
"""Parse every .gab file of the Gabbro repo and codebridge with tree-sitter.

Prints the files that contain ERROR or MISSING nodes and a total X/Y line.
Usage: python scripts/parse_all.py [root ...]
"""
import os
import subprocess
import sys

ROOTS = sys.argv[1:] or [r"C:\dev\gabbro", r"C:\dev\codebridge\src"]
SKIP = {".claude", "zig-out", "dist", ".zig-cache", "node_modules", ".git"}
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def find_files():
    out = []
    for root in ROOTS:
        for d, dirs, files in os.walk(root):
            dirs[:] = [x for x in dirs if x not in SKIP]
            out += [os.path.join(d, f) for f in files if f.endswith(".gab")]
    return sorted(out)


def main():
    files = find_files()
    bad = []
    for f in files:
        r = subprocess.run(
            ["tree-sitter", "parse", "--quiet", f],
            cwd=HERE, capture_output=True, text=True, encoding="utf8",
        )
        text = r.stdout + r.stderr
        hits = [l for l in text.splitlines() if "(ERROR" in l or "(MISSING" in l or l.startswith("Error")]
        if r.returncode != 0 or hits:
            bad.append((f, hits[:3] or text.strip().splitlines()[:3]))
    for f, info in bad:
        print("FAIL", f)
        for line in info:
            print("     ", line)
    print(f"{len(files) - len(bad)}/{len(files)} files parse clean")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
