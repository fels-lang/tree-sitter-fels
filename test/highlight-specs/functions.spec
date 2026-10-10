add :: fn(a: i32) -> i32 { return a; }
//? add | function
//? a#2 | variable.parameter
Counter :: struct {
    n: i32,
//? n | property
    bump :: fn(self: *Counter) { self.n += 1; }
//? bump | function.method
//? self#1 | variable.parameter
//? self#2 | variable.builtin
//? n += | property
}
main :: fn() {
    add(1);
//? add | function.call
    c.bump();
//? bump | function.method.call
    x := core::sizeof(i32);
//? core | module
//? sizeof | function.builtin
    y := utf16::to_utf8(s);
//? utf16 | module
//? to_utf8 | function.call
    z := @panic("no");
//? @panic | function.builtin
    w := other::LIMIT;
//? other | module
//? LIMIT | constant
    q := LIMIT + 1;
//? LIMIT | constant
    r := local;
//? local | variable
    p.x = 1;
//? x | property
}
swap :: macro(a: Expr) { return #quote { $a; }; }
//? swap | function.macro
//? $ | punctuation.special
//? a; | variable.special
