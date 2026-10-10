; Highlights for Fels.
;
; Order matters. When two patterns capture the same node, the pattern that
; comes LATER in this file wins (tree-sitter test and Zed both behave this
; way). So the general patterns are first and the specific ones last.

; ---------------------------------------------------------------------------
; Variables and constants (general)
; ---------------------------------------------------------------------------

(identifier) @variable

((identifier) @function.builtin
  (#match? @function.builtin "^@"))

((identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]*$"))

((identifier) @variable.builtin
  (#eq? @variable.builtin "self"))

; ---------------------------------------------------------------------------
; Literals
; ---------------------------------------------------------------------------

(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(null_literal) @constant.builtin

(string_literal) @string
(char_literal) @string
(escape_sequence) @string.escape

; ---------------------------------------------------------------------------
; Keywords
; ---------------------------------------------------------------------------

[
  "fn"
  "struct"
  "enum"
  "errors"
  "interface"
  "macro"
  "constraint"
  "distinct"
  "opaque"
  "type"
  "extern"
] @keyword

[
  "const"
  "volatile"
  "atomic"
  "borrow"
  "where"
] @keyword.modifier
(visibility_modifier) @keyword.modifier

[
  "if"
  "else"
  "while"
  "for"
  "match"
  "break"
  "continue"
] @keyword.control

"in" @keyword.operator
"as" @keyword.operator

"return" @keyword.return

[
  "catch"
  "fail"
  "defer"
] @keyword.exception
(defer_mode) @keyword.exception

[
  "zone"
  "unsafe"
] @keyword.memory

; ---------------------------------------------------------------------------
; Operators and punctuation
; ---------------------------------------------------------------------------

[
  "+" "-" "*" "/" "%"
  "+%" "-%" "*%"
  "==" "!=" "<" "<=" ">" ">="
  "&&" "||" "!" "~"
  "&" "|" "^" "<<" ">>"
  "=" "+=" "-=" "*=" "/=" "%=" "&=" "|=" "^=" "<<=" ">>="
  ":=" "::" "->" "=>"
  ".." "..="
  "?" "??" "!!"
  ".*"
] @operator

[ "(" ")" "[" "]" "{" "}" ".{" ] @punctuation.bracket

[ ";" "," "." ":" ] @punctuation.delimiter

"$" @punctuation.special

; ---------------------------------------------------------------------------
; Types
; ---------------------------------------------------------------------------

(type_identifier) @type
(primitive_type) @type.builtin
(opaque_type) @type.builtin

((type_identifier) @type.builtin
  (#any-of? @type.builtin "f32" "f64" "rune" "byte" "addr" "Self" "Expr" "Block"))

(module_identifier) @module
(scoped_type_identifier "::" @punctuation.delimiter)

(error_clause "!" @operator)

(type_parameter name: (identifier) @type.parameter)
(type_parameter_name (identifier) @type.parameter)
(type_variable (type_identifier) @type.parameter)
(type_parameter constraint: "type" @type.builtin)

; ---------------------------------------------------------------------------
; Declarations
; ---------------------------------------------------------------------------

(function_declaration name: (identifier) @function)
(struct_body
  (function_declaration name: (identifier) @function.method))
(method_list
  (function_declaration name: (identifier) @function.method))
(macro_declaration name: (identifier) @function.macro)

(constraint_declaration name: (identifier) @type)
(struct_declaration name: (identifier) @type)
(interface_declaration name: (identifier) @type)
(errors_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type)
(distinct_declaration name: (identifier) @type)
(opaque_declaration name: (identifier) @type)
(type_alias_declaration name: (identifier) @type)

(constant_declaration name: (identifier) @constant)
(global_declaration name: (identifier) @variable)

(field_declaration name: (field_identifier) @property)

(enum_variant name: (variant_identifier) @enum)
(error_variant name: (variant_identifier) @constant.error)
(fail_statement variant: (variant_identifier) @constant.error)

(parameter name: (identifier) @variable.parameter)
(zone_statement name: (identifier) @variable)

; ---------------------------------------------------------------------------
; Imports
; ---------------------------------------------------------------------------

(module_path (identifier) @module)
(import_declaration alias: (identifier) @module)
(import_declaration name: (identifier) @variable)

; ---------------------------------------------------------------------------
; Expressions
; ---------------------------------------------------------------------------

(scope_expression
  path: (identifier) @module
  name: (identifier) @variable)

(scope_expression
  path: (identifier) @module
  name: (identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]*$"))

(field_expression field: (field_identifier) @property)
(field_initializer name: (field_identifier) @property)
(named_argument name: (identifier) @property)

(enum_literal "." @punctuation.delimiter)
(enum_literal name: (variant_identifier) @enum)

(call_expression
  function: (identifier) @function.call)

((call_expression
  function: (identifier) @function.builtin)
  (#match? @function.builtin "^@"))

(call_expression
  function: (field_expression
    field: (field_identifier) @function.method.call))

(call_expression
  function: (scope_expression
    path: (identifier) @module
    name: (identifier) @function.call))

(call_expression
  function: (scope_expression
    path: (identifier) @module
    name: (identifier) @function.builtin)
  (#eq? @module "core"))

; Splices inside #quote
(splice_expression "$" @punctuation.special)
(splice_expression name: (identifier) @variable.special)

; ---------------------------------------------------------------------------
; Directives
; ---------------------------------------------------------------------------

; `#name(...)` attached to a declaration: #entry, #extern, #packed, #test ...
(attribute "#" @attribute)
(attribute name: (identifier) @attribute)

; Standalone compile time directives: #import, #assert, #run, #if ...
(import_declaration "#" @preproc "import" @preproc)
(static_assert "#" @preproc "assert" @preproc)
(system_library_directive "#" @preproc "system_library" @preproc)
(if_directive "#" @preproc "if" @preproc)
(for_directive "#" @preproc "for" @preproc)
(run_directive "#" @preproc "run" @preproc)
(run_expression "#" @preproc "run" @preproc)
(insert_directive "#" @preproc "insert" @preproc)
(quote_expression "#" @preproc "quote" @preproc)
(parse_expression "#" @preproc "parse" @preproc)

; ---------------------------------------------------------------------------
; Comments
; ---------------------------------------------------------------------------

(comment) @comment

((comment) @comment.doc
  (#match? @comment.doc "^///"))
