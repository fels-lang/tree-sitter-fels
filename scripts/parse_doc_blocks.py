#!/usr/bin/env python3
"""Parse the ```fels code blocks of the Fels docs. Fragments are expected
to fail sometimes; this script is a smoke test for syntax the .fels files do
not use (macros, quote, splices, lambdas)."""
import glob, os, re, subprocess, sys, tempfile

docs = sys.argv[1] if len(sys.argv) > 1 else r"C:\dev\gabbro\docs"
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = os.path.join(tempfile.gettempdir(), "doc_block.fels")
total = bad = 0
for md in sorted(glob.glob(os.path.join(docs, "*.md"))):
    text = open(md, encoding="utf8").read()
    for m in re.finditer(r"```fels\n(.*?)```", text, re.S):
        total += 1
        open(tmp, "w", encoding="utf8").write(m.group(1))
        r = subprocess.run(["tree-sitter", "parse", "--quiet", tmp], cwd=here,
                           capture_output=True, text=True, encoding="utf8")
        out = r.stdout + r.stderr
        if "(ERROR" in out or "(MISSING" in out:
            bad += 1
            line = m.start(1)
            lineno = text[:line].count("\n") + 2
            print(f"{os.path.basename(md)}:{lineno}")
print(f"{total - bad}/{total} doc blocks parse clean")
