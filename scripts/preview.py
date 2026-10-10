#!/usr/bin/env python3
"""Render sample Fels files to standalone HTML files in preview/.

The renderer asks `tree-sitter query` for the captures of queries/highlights.scm
and paints them onto the source. Later patterns win over earlier ones, which is
how the highlight tests and Zed treat overlapping captures. The colours follow
Zed One Dark. A dotted capture name falls back to its prefix (keyword.control
uses the colour of keyword when it has no own entry).

Usage: python scripts/preview.py
"""
import html
import os
import re
import subprocess

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "preview")

SAMPLES = [
    ("std_strings", r"C:\dev\gabbro\lib\std\strings.fels"),
    ("codebridge_main", r"C:\dev\codebridge\src\main.fels"),
    ("macros", os.path.join(HERE, "preview", "samples", "macros.fels")),
    ("extern_assert", r"C:\dev\codebridge\src\win32.fels"),
]

THEME = {
    "keyword": "#c678dd",
    "keyword.control": "#d19a66",
    "keyword.return": "#e06c75",
    "keyword.exception": "#ff7b72",
    "keyword.modifier": "#b57edc",
    "keyword.operator": "#c678dd",
    "keyword.memory": "#e5c07b",
    "function": "#61afef",
    "function.method": "#4fb8c4",
    "function.call": "#7fb8f0",
    "function.method.call": "#56c2c8",
    "function.builtin": "#2bbac5",
    "function.macro": "#f08fd0",
    "type": "#e5c07b",
    "type.builtin": "#d7a247",
    "type.parameter": "#f0c987",
    "variable": "#abb2bf",
    "variable.parameter": "#e9967a",
    "variable.builtin": "#e06c75",
    "variable.special": "#ff9bdc",
    "property": "#e06c75",
    "constant": "#d19a66",
    "constant.builtin": "#56b6c2",
    "constant.error": "#ff8f8f",
    "enum": "#be8fd8",
    "boolean": "#56b6c2",
    "number": "#d19a66",
    "number.float": "#e0a96d",
    "string": "#98c379",
    "string.escape": "#56b6c2",
    "comment": "#5c6370",
    "comment.doc": "#7f8896",
    "operator": "#56b6c2",
    "punctuation.bracket": "#9aa2b1",
    "punctuation.delimiter": "#7f8896",
    "punctuation.special": "#ff9bdc",
    "attribute": "#e5c07b",
    "preproc": "#d6a0f0",
    "module": "#8fbcbb",
    "embedded": "#abb2bf",
}


def color(name):
    while name:
        if name in THEME:
            return THEME[name]
        name = name.rpartition(".")[0]
    return None


CAP = re.compile(r"^\s+capture: \d+ - ([\w.]+), start: \((\d+), (\d+)\), end: \((\d+), (\d+)\)")
PAT = re.compile(r"^\s+pattern: (\d+)")


def captures(path):
    r = subprocess.run(
        ["tree-sitter", "query", os.path.join("queries", "highlights.scm"), path],
        cwd=HERE, capture_output=True, text=True, encoding="utf8",
    )
    out, pat = [], 0
    for line in r.stdout.splitlines():
        m = PAT.match(line)
        if m:
            pat = int(m.group(1))
            continue
        m = CAP.match(line)
        if m:
            name, r1, c1, r2, c2 = m.group(1), *map(int, m.groups()[1:])
            out.append((pat, name, r1, c1, r2, c2))
    return out


def render(title, path):
    data = open(path, "rb").read()
    lines = data.split(b"\n")
    starts, pos = [], 0
    for ln in lines:
        starts.append(pos)
        pos += len(ln) + 1
    paint = [None] * len(data)
    for pat, name, r1, c1, r2, c2 in sorted(captures(path)):
        a, b = starts[r1] + c1, starts[r2] + c2
        for i in range(a, min(b, len(data))):
            paint[i] = name
    parts, i = [], 0
    while i < len(data):
        j = i
        while j < len(data) and paint[j] == paint[i]:
            j += 1
        text = html.escape(data[i:j].decode("utf8", "replace"))
        col = color(paint[i]) if paint[i] else None
        parts.append(f'<span style="color:{col}" title="{paint[i]}">{text}</span>' if col else text)
        i = j
    body = "".join(parts)
    legend = "".join(
        f'<span style="color:{c}">{n}</span>' for n, c in THEME.items()
    )
    page = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>
body {{ background:#282c34; color:#abb2bf; margin:0; padding:16px; font-family:Consolas,Menlo,monospace; }}
h1 {{ font-size:14px; color:#7f8896; font-weight:normal; }}
pre {{ font-size:13px; line-height:1.45; tab-size:4; margin:0; }}
.legend {{ display:flex; flex-wrap:wrap; gap:4px 14px; margin:12px 0 20px; font-size:12px; }}
</style></head><body>
<h1>{html.escape(os.path.basename(path))} (hover a token to see its capture)</h1>
<div class="legend">{legend}</div>
<pre>{body}</pre>
</body></html>"""
    with open(os.path.join(OUT, title + ".html"), "w", encoding="utf8") as f:
        f.write(page)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for title, path in SAMPLES:
        render(title, path)
        print("wrote", os.path.join("preview", title + ".html"))
