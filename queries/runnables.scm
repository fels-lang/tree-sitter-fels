; A function marked with the #test attribute. Tests run on the comptime VM
; during compilation, so a task for this tag is expected to run `gabbro check`
; or `gabbro build` on the file. The format follows Zed runnables queries
; (@run on the name, a tag capture on the marker); it has not been tried in Zed.
(function_declaration
  (attribute
    name: (identifier) @_gabbro-test-tag
    (#eq? @_gabbro-test-tag "test"))
  name: (identifier) @run)
