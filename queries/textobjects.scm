(function_declaration
  body: (block
    "{"
    (_)* @function.inside
    "}")) @function.around

(macro_declaration
  body: (block
    "{"
    (_)* @function.inside
    "}")) @function.around

(lambda_expression
  body: (block
    "{"
    (_)* @function.inside
    "}")) @function.around

(struct_declaration
  body: (struct_body
    "{"
    (_)* @class.inside
    "}")) @class.around

(enum_declaration
  "{"
  (_)* @class.inside
  "}") @class.around

(errors_declaration
  "{"
  (_)* @class.inside
  "}") @class.around

(interface_declaration
  body: (method_list
    "{"
    (_)* @class.inside
    "}")) @class.around

(comment)+ @comment.around
