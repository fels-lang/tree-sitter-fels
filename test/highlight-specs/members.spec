Color :: enum { red, green: i32 }
//? red | enum
//? i32 | type.builtin
Err :: errors { eof, bad: i32 }
//? eof | constant.error
f :: fn() -> i32 ! Err {
    c: Color = .red;
//? . | punctuation.delimiter
//? red | enum
    p := .{ .x = 1 };
//? x | property
    fail .eof;
//? eof | constant.error
    g(name: 1);
//? name | property
    if c == .green { }
//? green | enum
}
LIMIT :: 5;
//? LIMIT | constant
// A comment
//? // A comment | comment
/// A doc comment
//? /// A doc comment | comment.doc
