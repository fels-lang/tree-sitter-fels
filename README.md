# tree-sitter-fels

A tree-sitter grammar for the Fels programming language. Fels source files end in `.fels`.

The grammar follows the compiler parser (`src/parser.zig` in the Fels repo). Where the docs and the parser disagree, the parser wins.

## What is here

- `grammar.js`: the grammar.
- `src/scanner.c`: a small external scanner. It only tells the opening `|` of a capture (`if x |v| { }`) from the bitwise or operator.
- `src/parser.c`, `src/grammar.json`, `src/node-types.json`, `src/tree_sitter/`: generated files, committed so editors can build the grammar from the repo.
- `queries/`: `highlights.scm`, `brackets.scm`, `indents.scm`, `outline.scm`, `textobjects.scm`, `overrides.scm`, `runnables.scm`, `injections.scm`.
- `test/corpus/`: parse tests, one file per feature area.
- `test/highlight/`: highlight tests. They are generated from `test/highlight-specs/` by `scripts/make_highlight_tests.py`.
- `scripts/parse_all.py`: parses every `.fels` file of the Fels repo and of `codebridge/src` and reports ERROR or MISSING nodes.
- `scripts/parse_doc_blocks.py`: parses the code blocks of the Fels docs. Many blocks are fragments, so some failures are expected. It is a smoke test for syntax that no `.fels` file uses yet, such as macros.
- `scripts/preview.py`: renders sample files to HTML in `preview/`.

## Use

```
tree-sitter generate
tree-sitter test
python scripts/parse_all.py
python scripts/preview.py
```

## Notes on the grammar

- Comments are `//` only. There are no block comments.
- Postfix operators (`()`, `.`, `[]`, `?`, `!!`, `??`, `catch`) bind tighter than every other operator. A prefix operator (`-`, `!`, `~`, `&`, `*`) binds tighter than `as`, and `as` tighter than every binary operator: `-x as u8` is `(-x) as u8`, `a * b as i64` is `a * (b as i64)`. `??` takes a whole expression on its right and is right associative.
- Binary precedence, loosest first: `||`, `&&`, comparisons, `|`, `^`, `&`, shifts, `+ - +% -%`, `* / % *%`. All are left associative. Shifts bind looser than addition.
- `unsafe expr` takes an operand that includes the operators from `^` upward.
- There is no `Name { ... }` struct literal, only `.{ ... }`. So `{` after a condition always starts a block.
- `Name :: <type>;` is a type alias when the right side starts with a primitive type, `[`, `*`, `?`, `borrow` or `atomic`. Otherwise it is a constant.
- An identifier may start with `@` (`@panic`, `@if`).

## License

Apache-2.0. See `LICENSE`.
