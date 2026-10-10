#import std.io;
//? #import | preproc
//? std | module
//? io | module
#import std.mem.{ alloc };
//? alloc | variable
#import std.strings as str;
//? str | module
#entry
//? #entry | attribute
main :: fn() { }
#extern("kernel32", "ExitProcess") pub Exit :: fn(code: u32);
//? #extern | attribute
//? "kernel32" | string
//? "ExitProcess" | string
#assert(N > 0, "N must be positive");
//? #assert | preproc
//? "N must be positive" | string
f :: fn() {
    #if N > 1 { a(); }
//? # | preproc
//? if | preproc
    #for i in 0..4 { }
//? for | preproc
    #run { }
//? run | preproc
    #insert #quote { x := 1; };
//? insert | preproc
//? quote | preproc
    y := #run g();
//? run | preproc
    z := #parse("a");
//? parse | preproc
}
#derive(Eq)
//? #derive | attribute
#packed
//? #packed | attribute
#align(16)
//? #align | attribute
//? 16 | number
#test
//? #test | attribute
S :: struct { a: u8 }
//? S | type
