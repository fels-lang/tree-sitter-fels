#!/usr/bin/env python3
"""Generate test/highlight/*.gab from the specs in test/highlight-specs/*.spec.

A spec is a Gabbro file where a line starting with `//? ` is an assertion about
the previous code line:

    //? token | capture          first occurrence of `token` in the code line
    //? token#2 | capture        second occurrence
    //? token | !capture         the token must NOT have this capture

The generator turns each into the caret comment that `tree-sitter test` reads.
Writing columns by hand is error prone, so this keeps the specs readable.
"""
import glob
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def column(line, token):
    n = 1
    if "#" in token and token.rsplit("#", 1)[1].isdigit():
        token, n = token.rsplit("#", 1)
        n = int(n)
    pos = -1
    for _ in range(n):
        pos = line.find(token, pos + 1)
        if pos < 0:
            raise SystemExit(f"token {token!r} (#{n}) not found in: {line}")
    return pos


def main():
    out_dir = os.path.join(HERE, "test", "highlight")
    for spec in sorted(glob.glob(os.path.join(HERE, "test", "highlight-specs", "*.spec"))):
        out = []
        code = ""
        for raw in open(spec, encoding="utf8").read().splitlines():
            if raw.startswith("//? "):
                token, cap = [x.strip() for x in raw[4:].rsplit("|", 1)]
                col = column(code, token)
                if col == 0:
                    out.append(f"// <- {cap}")
                elif col >= 2:
                    out.append("//" + " " * (col - 2) + f"^ {cap}")
                else:
                    raise SystemExit(f"token at column {col} cannot be asserted: {code}")
            else:
                code = raw
                out.append(raw)
        name = os.path.splitext(os.path.basename(spec))[0] + ".gab"
        with open(os.path.join(out_dir, name), "w", encoding="utf8", newline="\n") as f:
            f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
