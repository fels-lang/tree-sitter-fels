/**
 * Tree-sitter grammar for the Fels programming language.
 *
 * The compiler parser (src/parser.zig) is the source of truth. Notes:
 *  - Only `//` line comments exist.
 *  - Postfix operators (call, field, index, `?`, `!!`, `??`, `catch`)
 *    bind tighter than every binary operator, and also inside unary operands.
 *  - A prefix operator binds tighter than `as` (`-x as u8` is `(-x) as u8`), and
 *    `as` tighter than the binary operators.
 *  - `??` takes a full expression as its right side (greedy, right associative).
 */

const PREC = {
  coalesce: 5,
  unary: 95,
  cast: 92,
  or: 10,
  and: 20,
  compare: 30,
  bit_or: 40,
  unsafe: 45,
  bit_xor: 50,
  bit_and: 60,
  shift: 70,
  add: 80,
  mul: 90,
  postfix: 100,
};

const PRIMITIVES = [
  'bool', 'void',
  'i8', 'i16', 'i32', 'i64', 'isize',
  'u8', 'u16', 'u32', 'u64', 'usize',
];

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

module.exports = grammar({
  name: 'fels',

  word: $ => $.identifier,

  extras: $ => [/\s/, $.comment],

  externals: $ => [$._capture_open],

  conflicts: $ => [
    [$.if_directive],
    [$.if_statement],
    [$.function_type],
    [$.match_statement, $.match_expression],
    [$.type_parameter, $.type_variable],
    [$.function_type, $.lambda_parameters],
    [$.type_variable, $.splice_expression],
    [$.error_clause],
    [$.parameter_list, $.lambda_parameters],
    [$.local_constant, $._primary],
    [$.parameter_list, $.function_type, $.lambda_parameters],
    [$.parameter_list, $.function_type],
    [$._type, $._primary],
    [$._type_name, $._primary],
    [$.block, $.compound_literal],
    [$._alias_type, $._primary],
  ],

  rules: {
    source_file: $ => repeat($._item),

    _item: $ => choice(
      $.import_declaration,
      $.system_library_directive,
      $.static_assert,
      $._declaration,
    ),

    comment: _ => token(seq('//', /[^\n]*/)),

    // ---------------------------------------------------------------------
    // Top level
    // ---------------------------------------------------------------------

    import_declaration: $ => seq(
      '#', 'import',
      field('path', $.module_path),
      optional(choice(
        seq('.{', commaSep(field('name', $.identifier)), optional(','), '}'),
        '.*',
        seq('as', field('alias', $.identifier)),
      )),
      ';',
    ),

    module_path: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    system_library_directive: $ => seq('#', 'system_library', '(', $.string_literal, ')', ';'),

    static_assert: $ => seq(
      '#', 'assert', '(',
      field('condition', $._expression),
      optional(seq(',', field('message', $.string_literal))),
      ')', ';',
    ),

    attribute: $ => seq(
      '#',
      field('name', $.identifier),
      optional(field('arguments', $.attribute_arguments)),
    ),

    attribute_arguments: $ => seq('(', commaSep($._expression), ')'),

    visibility_modifier: _ => 'pub',

    _declaration: $ => choice(
      $.function_declaration,
      $.macro_declaration,
      $.constraint_declaration,
      $.struct_declaration,
      $.interface_declaration,
      $.errors_declaration,
      $.enum_declaration,
      $.distinct_declaration,
      $.opaque_declaration,
      $.type_alias_declaration,
      $.constant_declaration,
      $.global_declaration,
      $.interface_impl,
    ),

    function_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'fn',
      $._signature,
    ),

    macro_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'macro',
      $._signature,
    ),

    constraint_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'constraint',
      '(', $.type_parameter_name, ')',
      field('body', $.block),
    ),

    type_parameter_name: $ => seq('$', $.identifier),

    _signature: $ => seq(
      field('parameters', $.parameter_list),
      optional(seq('->', field('return_type', $._type))),
      optional($.error_clause),
      optional($.where_clause),
      choice(field('body', $.block), ';'),
    ),

    parameter_list: $ => seq(
      '(',
      optional(choice(
        seq(
          commaSep1(choice($.type_parameter, $.parameter)),
          optional(seq(',', optional($.variadic_parameter))),
        ),
        $.variadic_parameter,
      )),
      ')',
    ),

    // `...` after the parameters of an `#extern` C function.
    variadic_parameter: _ => '...',

    type_parameter: $ => seq(
      '$', field('name', $.identifier),
      optional(seq(':', field('constraint', choice('type', alias($.identifier, $.type_identifier))))),
    ),

    parameter: $ => seq(
      field('name', $.identifier), ':', field('type', $._type),
    ),

    error_clause: $ => seq(
      '!',
      optional(field('error', choice(
        $.inline_error_set,
        $._type_name,
        $.scoped_type_identifier,
      ))),
    ),

    inline_error_set: $ => prec.dynamic(2, seq('{', repeat($.error_variant), '}')),

    where_clause: $ => seq(
      'where',
      choice($.block, commaSep1($.where_bound)),
    ),

    where_bound: $ => seq(
      field('parameter', alias($.identifier, $.type_identifier)),
      ':',
      field('constraint', alias($.identifier, $.type_identifier)),
    ),

    struct_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', field('kind', choice('struct', 'union')),
      optional(field('type_parameters', $.struct_type_parameters)),
      field('body', $.struct_body),
    ),

    struct_type_parameters: $ => seq('(', commaSep($.type_parameter), ')'),

    struct_body: $ => seq('{', repeat(choice($.field_declaration, $.function_declaration)), '}'),

    field_declaration: $ => seq(
      field('name', alias($.identifier, $.field_identifier)), ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression))),
      optional(','),
    ),

    interface_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'interface',
      field('body', $.method_list),
    ),

    interface_impl: $ => seq(
      field('type', alias($.identifier, $.type_identifier)), 'as',
      field('interface', alias($.identifier, $.type_identifier)),
      field('body', $.method_list),
    ),

    method_list: $ => seq('{', repeat($.function_declaration), '}'),

    errors_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'errors',
      '{', repeat($.error_variant), '}',
    ),

    error_variant: $ => seq(
      optional('.'),
      field('name', alias($.identifier, $.variant_identifier)),
      optional(seq(':', field('payload', $._type))),
      optional(','),
    ),

    enum_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'enum',
      '{', repeat($.enum_variant), '}',
    ),

    enum_variant: $ => seq(
      optional('.'),
      field('name', alias($.identifier, $.variant_identifier)),
      optional(seq(':', field('payload', $._type))),
      optional(','),
    ),

    distinct_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'distinct', field('type', $._type), ';',
    ),

    opaque_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::', 'opaque', ';',
    ),

    type_alias_declaration: $ => prec.dynamic(2, seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), '::',
      field('type', $._alias_type), ';',
    )),

    // Aliases are recognised by the first token of the right hand side.
    _alias_type: $ => choice(
      $.primitive_type,
      $.array_type,
      $.slice_type,
      $.many_pointer_type,
      $.pointer_type,
      $.optional_type,
      $.borrow_type,
      $.atomic_type,
    ),

    constant_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier),
      choice('::', seq(':', field('type', $._type), ':')),
      field('value', $._expression), ';',
    ),

    // `N :: 4;` or `N : u8 : 4;` in a function body: a constant of its block.
    // A name after the `::` makes it a scope access (`io::println(x);`) as well: that wins.
    local_constant: $ => prec.dynamic(-1, seq(
      field('name', $.identifier),
      choice('::', seq(':', field('type', $._type), ':')),
      field('value', $._expression), ';',
    )),

    global_declaration: $ => seq(
      repeat($.attribute),
      optional(seq($.visibility_modifier, repeat($.attribute))),
      field('name', $.identifier), ':',
      field('type', $._type), '=',
      field('value', $._expression), ';',
    ),

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    _type: $ => choice(
      $.primitive_type,
      $._type_name,
      $.scoped_type_identifier,
      $.generic_type,
      $.type_variable,
      $.optional_type,
      $.pointer_type,
      $.many_pointer_type,
      $.slice_type,
      $.array_type,
      $.atomic_type,
      $.borrow_type,
      $.function_type,
      $.opaque_type,
    ),

    primitive_type: _ => choice(...PRIMITIVES),

    _type_name: $ => alias($.identifier, $.type_identifier),

    scoped_type_identifier: $ => prec(1, seq(
      field('path', alias($.identifier, $.module_identifier)), '::',
      field('name', alias($.identifier, $.type_identifier)),
    )),

    generic_type: $ => prec(1, seq(
      field('type', choice($._type_name, $.scoped_type_identifier)),
      field('arguments', $.type_arguments),
    )),

    type_arguments: $ => seq('(', commaSep($._type), optional(','), ')'),

    type_variable: $ => seq('$', alias($.identifier, $.type_identifier)),

    opaque_type: _ => 'opaque',

    optional_type: $ => seq('?', field('inner', $._type)),

    pointer_type: $ => seq(
      '*', optional('const'), optional('volatile'), field('inner', $._type),
    ),

    many_pointer_type: $ => seq(
      '[', '*', ']', optional('const'), field('inner', $._type),
    ),

    slice_type: $ => seq('[', ']', optional('const'), field('inner', $._type)),

    array_type: $ => seq(
      '[', field('length', $._expression), ']', field('inner', $._type),
    ),

    atomic_type: $ => seq('atomic', field('inner', $._type)),

    borrow_type: $ => seq('borrow', field('inner', $._type)),

    function_type: $ => seq(
      optional('extern'), 'fn',
      '(', commaSep($._type), ')',
      optional(seq('->', field('return_type', $._type))),
      optional($.error_clause),
    ),

    // ---------------------------------------------------------------------
    // Statements
    // ---------------------------------------------------------------------

    block: $ => seq('{', repeat($._statement), '}'),

    _statement: $ => choice(
      $.return_statement,
      $.yield_statement,
      $.fail_statement,
      $.break_statement,
      $.continue_statement,
      $.defer_statement,
      $.match_statement,
      $.if_directive,
      $.for_directive,
      $.run_directive,
      $.insert_directive,
      $.zone_statement,
      $.unsafe_block,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      alias($.local_constant, $.constant_declaration),
      $.variable_declaration,
      $.assignment_statement,
      $.expression_statement,
    ),

    return_statement: $ => seq('return', optional($._expression), ';'),

    // `yield value;` in a `catch` handler: the value the `catch` expression takes.
    yield_statement: $ => seq('yield', $._expression, ';'),

    fail_statement: $ => seq(
      'fail', '.', field('variant', alias($.identifier, $.variant_identifier)),
      optional(field('payload', $.fail_payload)),
      ';',
    ),

    fail_payload: $ => seq('{', commaSep($._expression), optional(','), '}'),

    break_statement: $ => seq('break', optional(field('label', alias($.identifier, $.label))), ';'),
    continue_statement: $ => seq('continue', optional(field('label', alias($.identifier, $.label))), ';'),

    // `outer:` before a loop, for a `break outer;` or `continue outer;` inside it.
    _loop_label: $ => seq(field('label', alias($.identifier, $.label)), ':'),

    defer_statement: $ => seq(
      'defer',
      optional(seq('.', field('mode', alias(choice('ok', 'err'), $.defer_mode)))),
      choice(field('body', $.block), seq($._expression, ';')),
    ),

    zone_statement: $ => seq(
      'zone', field('name', $.identifier), ':',
      field('kind', alias($.identifier, $.type_identifier)),
      field('body', $.block),
    ),

    unsafe_block: $ => seq('unsafe', $.block),

    if_statement: $ => seq(
      'if',
      optional(seq(field('binding', $.identifier), ':=')),
      field('condition', $._expression),
      optional($.if_capture),
      field('consequence', $.block),
      optional($.else_clause),
    ),

    if_capture: $ => seq(alias($._capture_open, '|'), field('name', $.identifier), '|'),

    else_clause: $ => seq('else', choice($.if_statement, $.block)),

    while_statement: $ => seq(
      optional($._loop_label),
      'while',
      field('condition', $._expression),
      optional($.if_capture),
      field('body', $.block),
    ),

    for_statement: $ => seq(
      optional($._loop_label),
      'for',
      optional('&'),
      field('binding', $.identifier),
      optional(seq(',', field('index', $.identifier))),
      'in',
      field('iterable', $._expression),
      optional(seq(choice('..', '..='), field('end', $._expression))),
      field('body', $.block),
    ),

    variable_declaration: $ => seq(
      field('name', $.identifier),
      choice(
        seq(':=', field('value', $._expression)),
        seq(':', field('type', $._type), '=', field('value', $._expression)),
      ),
      ';',
    ),

    assignment_statement: $ => seq(
      field('left', $._expression),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=')),
      field('right', $._expression),
      ';',
    ),

    expression_statement: $ => seq($._expression, ';'),

    // Compile time directives in statement position.

    if_directive: $ => seq(
      '#', 'if', field('condition', $._expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', $.block))),
    ),

    for_directive: $ => seq(
      '#', 'for', field('binding', $.identifier), 'in',
      field('start', $._expression), choice('..', '..='),
      field('end', $._expression),
      field('body', $.block),
    ),

    run_directive: $ => prec.dynamic(1, seq('#', 'run', $.block)),

    insert_directive: $ => seq('#', 'insert', $._expression, ';'),

    // ---------------------------------------------------------------------
    // Match
    // ---------------------------------------------------------------------

    match_statement: $ => seq(
      'match', field('subject', $._expression), field('body', $.match_body),
    ),

    match_expression: $ => seq(
      'match', field('subject', $._expression), field('body', $.match_body),
    ),

    match_body: $ => seq('{', repeat($.match_arm), '}'),

    match_arm: $ => seq(
      field('pattern', $.match_pattern),
      optional($.match_capture),
      optional($.match_guard),
      '=>',
      field('body', choice($.block, $._statement, $._expression)),
      optional(','),
    ),

    match_pattern: $ => choice(
      'else',
      commaSep1($.string_literal),
      seq(
        commaSep1($.integer_literal),
        optional(seq(choice('..', '..='), $._expression)),
      ),
      $.enum_literal,
      $.identifier,
    ),

    match_capture: $ => seq('|', field('name', $.identifier), '|'),

    match_guard: $ => seq('if', field('condition', $._expression)),

    // ---------------------------------------------------------------------
    // Expressions
    // ---------------------------------------------------------------------

    _expression: $ => choice(
      $.binary_expression,
      prec(-1, $._operand),
    ),

    binary_expression: $ => {
      const table = [
        [PREC.or, '||'],
        [PREC.and, '&&'],
        [PREC.compare, choice('==', '!=', '<', '<=', '>', '>=')],
        [PREC.bit_or, '|'],
        [PREC.bit_xor, '^'],
        [PREC.bit_and, '&'],
        [PREC.shift, choice('<<', '>>')],
        [PREC.add, choice('+', '-', '+%', '-%')],
        [PREC.mul, choice('*', '/', '%', '*%')],
      ];
      return choice(...table.map(([p, op]) => prec.left(p, seq(
        field('left', $._expression),
        field('operator', op),
        field('right', $._expression),
      ))));
    },

    _operand: $ => choice(
      $._primary,
      $.unary_expression,
      $.call_expression,
      $.field_expression,
      $.scope_expression,
      $.index_expression,
      $.slice_expression,
      $.try_expression,
      $.force_unwrap_expression,
      $.cast_expression,
      $.coalesce_expression,
      $.catch_expression,
      $.unsafe_expression,
      $.run_expression,
    ),

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('-', '!', '~', '&', '*')),
      field('operand', $._operand),
    )),

    unsafe_expression: $ => prec(PREC.unsafe, seq('unsafe', $._expression)),

    run_expression: $ => prec(PREC.unary, seq('#', 'run', $._operand)),

    call_expression: $ => prec(PREC.postfix, seq(
      field('function', $._operand),
      field('arguments', $.argument_list),
    )),

    argument_list: $ => seq('(', commaSep($._argument), optional(','), ')'),

    _argument: $ => choice(
      $.named_argument,
      $._expression,
      alias($._argument_pointer_type, $.pointer_type),
    ),

    // A pointer type with a qualifier given as a call argument: `*const u8`.
    _argument_pointer_type: $ => seq(
      '*',
      choice(
        seq(choice('const', 'volatile', seq('const', 'volatile')), field('inner', $._type)),
        alias($._argument_pointer_type, $.pointer_type),
      ),
    ),

    named_argument: $ => seq(
      field('name', $.identifier), ':',
      field('value', choice($._expression, alias($._brace_literal, $.compound_literal))),
    ),

    _brace_literal: $ => seq('{', commaSep1($._literal_element), optional(','), '}'),

    field_expression: $ => prec(PREC.postfix, seq(
      field('value', $._operand), '.',
      field('field', alias($.identifier, $.field_identifier)),
    )),

    scope_expression: $ => prec(PREC.postfix, seq(
      field('path', $._operand), '::', field('name', $.identifier),
    )),

    index_expression: $ => prec(PREC.postfix, seq(
      field('value', $._operand), '[', field('index', $._expression), ']',
    )),

    slice_expression: $ => prec(PREC.postfix, seq(
      field('value', $._operand), '[',
      choice(
        ':',
        seq('..', optional(field('end', $._expression))),
        seq(field('start', $._expression), '..', optional(field('end', $._expression))),
      ),
      ']',
    )),

    try_expression: $ => prec(PREC.postfix, seq(field('value', $._operand), '?')),

    force_unwrap_expression: $ => prec(PREC.postfix, seq(field('value', $._operand), '!!')),

    cast_expression: $ => prec(PREC.cast, seq(
      field('value', $._operand), 'as', field('type', $._type),
    )),

    coalesce_expression: $ => prec.right(PREC.coalesce, seq(
      field('value', $._operand), '??', field('default', $._expression),
    )),

    catch_expression: $ => prec(PREC.postfix, seq(
      field('value', $._operand), 'catch',
      field('error', $.identifier), field('handler', $.block),
    )),

    _primary: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.raw_string_literal,
      $.multiline_string_literal,
      $.char_literal,
      $.boolean_literal,
      $.null_literal,
      $.enum_literal,
      $.compound_literal,
      $.parenthesized_expression,
      $.lambda_expression,
      $.if_expression,
      $.match_expression,
      $.quote_expression,
      $.parse_expression,
      $.splice_expression,
      // Types used as values (type arguments of builtins and generics).
      $.primitive_type,
      $.optional_type,
      $.many_pointer_type,
      $.slice_type,
      $.array_type,
      $.atomic_type,
      $.borrow_type,
      $.function_type,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    enum_literal: $ => seq('.', field('name', alias($.identifier, $.variant_identifier))),

    compound_literal: $ => choice(
      seq('.{', optional(seq(commaSep1($._literal_element), optional(','))), '}'),
      seq('{', '}'),
    ),

    _literal_element: $ => choice($.field_initializer, $._expression),

    field_initializer: $ => seq(
      '.', field('name', alias($.identifier, $.field_identifier)), '=',
      field('value', $._expression),
    ),

    lambda_expression: $ => seq(
      'fn', field('parameters', $.lambda_parameters),
      optional(seq('->', field('return_type', $._type))),
      field('body', $.block),
    ),

    lambda_parameters: $ => seq('(', commaSep($.parameter), optional(','), ')'),

    if_expression: $ => seq(
      'if', field('condition', $._expression),
      '{', field('consequence', $._expression), '}',
      'else',
      choice(
        $.if_expression,
        seq('{', field('alternative', $._expression), '}'),
      ),
    ),

    quote_expression: $ => seq(
      '#', 'quote',
      choice($.block, seq('(', $._expression, ')')),
    ),

    parse_expression: $ => seq('#', 'parse', '(', $._expression, ')'),

    splice_expression: $ => seq(
      '$',
      choice(
        field('name', $.identifier),
        seq('(', $._expression, ')'),
      ),
    ),

    // ---------------------------------------------------------------------
    // Tokens
    // ---------------------------------------------------------------------

    identifier: _ => /@?[a-zA-Z_][a-zA-Z0-9_]*/,

    integer_literal: _ => token(choice(
      /0[xX][0-9a-zA-Z_]*/,
      /0[bB][0-9a-zA-Z_]*/,
      /[0-9][0-9a-zA-Z_]*/,
    )),

    // `1.5`, `1.5e-3`, `1e5`: a point, an exponent, or both (an exponent makes a float).
    float_literal: _ => token(prec(1, choice(
      /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9][0-9_]*)?[a-zA-Z0-9_]*/,
      /[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*[a-zA-Z0-9_]*/,
    ))),

    boolean_literal: _ => choice('true', 'false'),

    null_literal: _ => 'null',

    string_literal: $ => seq(
      '"',
      repeat(choice(
        alias($._string_content, $.string_content),
        $.escape_sequence,
      )),
      '"',
    ),

    _string_content: _ => token.immediate(prec(1, /[^"\\]+/)),

    // `r"C:\dir"`: the bytes as written, on one line, with no escapes.
    raw_string_literal: _ => token(prec(1, seq('r"', /[^"\n]*/, '"'))),

    // `"""` lines `"""`: a `"` needs no backslash; the escapes are those of any string.
    multiline_string_literal: $ => seq(
      '"""',
      repeat(choice(
        alias($._multiline_content, $.string_content),
        $.escape_sequence,
      )),
      '"""',
    ),

    _multiline_content: _ => token.immediate(prec(1, /([^"\\]|"[^"\\]|""[^"\\])+/)),

    char_literal: $ => seq(
      "'",
      choice(
        $.escape_sequence,
        alias(token.immediate(/[^'\\\n]+/), $.char_content),
      ),
      "'",
    ),

    escape_sequence: _ => token.immediate(seq('\\', choice(
      /x[0-9a-fA-F]{2}/,
      /[\s\S]/,
    ))),
  },
});
