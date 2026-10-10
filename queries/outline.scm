(import_declaration
  "import" @context
  path: (module_path) @name) @item

(function_declaration
  name: (_) @name
  "fn" @context) @item

(macro_declaration
  name: (_) @name
  "macro" @context) @item

(constraint_declaration
  name: (_) @name
  "constraint" @context) @item

(struct_declaration
  name: (_) @name
  "struct" @context) @item

(interface_declaration
  name: (_) @name
  "interface" @context) @item

(errors_declaration
  name: (_) @name
  "errors" @context) @item

(enum_declaration
  name: (_) @name
  "enum" @context) @item

(distinct_declaration
  name: (_) @name
  "distinct" @context) @item

(opaque_declaration
  name: (_) @name
  "opaque" @context) @item

(type_alias_declaration
  name: (_) @name) @item

(constant_declaration
  name: (_) @name) @item

(global_declaration
  name: (_) @name) @item

(interface_impl
  type: (_) @name
  "as" @context
  interface: (_) @context) @item

(field_declaration
  name: (_) @name) @item

(enum_variant
  name: (_) @name) @item
