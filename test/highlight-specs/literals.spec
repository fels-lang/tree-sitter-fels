A :: 42;
//? 42 | number
B :: 0xFFusize;
//? 0xFFusize | number
C :: 0b1010u8;
//? 0b1010u8 | number
D :: 1_000;
//? 1_000 | number
E :: 2.5f64;
//? 2.5f64 | number.float
F :: true;
//? true | boolean
G :: null;
//? null | constant.builtin
H :: "pin\n";
//? pin | string
//? \n | string.escape
I :: 'a';
//? 'a' | string
J :: '\n';
//? \n | string.escape
K :: "pin";
//? pin | !keyword
//? pin | string
