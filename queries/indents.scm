; Indent after an opening bracket, outdent at the closing one.
[
  (block)
  (struct_body)
  (method_list)
  (match_body)
  (compound_literal)
  (parameter_list)
  (lambda_parameters)
  (argument_list)
  (attribute_arguments)
  (type_arguments)
  (struct_type_parameters)
  (fail_payload)
  (inline_error_set)
  (errors_declaration)
  (enum_declaration)
] @indent

[
  "}"
  ")"
  "]"
] @outdent

; Statement bodies of a match arm continue one level in.
(match_arm
  "=>" @indent)
