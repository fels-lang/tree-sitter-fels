Point :: struct { x: i32 }
//? Point | type
//? :: | operator
//? struct | keyword
pub main :: fn() -> i32 {
//? pub | keyword.modifier
//? main | function
//? fn | keyword
    if true { return 1; } else { return 2; }
//? if | keyword.control
//? return | keyword.return
//? else | keyword.control
//? true | boolean
    while x { break; continue; }
//? while | keyword.control
//? break | keyword.control
//? continue | keyword.control
    zone z: Arena { }
//? zone | keyword.memory
//? Arena | type
    for i in 0..3 { }
//? for | keyword.control
//? in | keyword.operator
//? .. | operator
    y := x as u8;
//? := | operator
//? as | keyword.operator
//? u8 | type.builtin
    defer.ok done();
//? defer | keyword.exception
//? ok | keyword.exception
    v := f() catch e { fail .bad; };
//? catch | keyword.exception
//? fail | keyword.exception
    unsafe { }
//? unsafe | keyword.memory
    match c { else => { } }
//? match | keyword.control
//? else | keyword.control
//? => | operator
}
Shapes :: enum { circle }
//? enum | keyword
Errs :: errors { oops }
//? errors | keyword
Api :: interface { }
//? interface | keyword
Id :: distinct usize;
//? distinct | keyword
//? usize | type.builtin
Handle :: opaque;
//? opaque | keyword
twice :: macro(b: Block) { }
//? macro | keyword
//? Block | type.builtin
