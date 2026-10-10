; A function marked with the #test attribute. Tests run on the comptime VM
; during compilation, so a task for this tag is expected to run `fels check`
; or `fels build` on the file. The format follows Zed runnables queries
; (@run on the name, a tag capture on the marker); it has not been tried in Zed.
(function_declaration
  (attribute
    name: (identifier) @_fels-test-tag
    (#eq? @_fels-test-tag "test"))
  name: (identifier) @run)
