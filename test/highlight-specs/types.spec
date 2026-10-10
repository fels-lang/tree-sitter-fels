a: *const u8 = x;
//? const | keyword.modifier
//? u8 | type.builtin
b: []u8 = x;
//? u8 | type.builtin
c: [4]f64 = x;
//? f64 | type.builtin
//? 4 | number
d: ?Foo = x;
//? ? | operator
//? Foo | type
e: fn(i32) -> Bar = x;
//? fn | keyword
//? -> | operator
//? Bar | type
f: m::Name = x;
//? m | module
//? Name | type
g: Vec(Item) = x;
//? Vec | type
//? Item | type
h :: fn(x: $T, $U: type) -> T ! Err { }
//? x | variable.parameter
//? $#1 | punctuation.special
//? T#1 | type.parameter
//? type | type.builtin
//? ! | operator
//? Err | type
Boxed :: struct($T: type) { value: T }
//? T#1 | type.parameter
//? value | property
//? T#2 | type
Opt :: ?*const u8;
//? Opt | type
