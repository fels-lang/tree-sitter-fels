; Run buttons in the gutter. The tag picks the tasks of tasks.json that a button offers; the
; captures not starting with `_` are given to those tasks as $ZED_CUSTOM_<capture>.

; A #test function: run it alone, or the tests of its file.
(
  (function_declaration
    (attribute
      name: (identifier) @_attribute
      (#eq? @_attribute "test"))
    name: (identifier) @run @test_name)
  (#set! tag fels-test)
)

; The program's main: run the file, or the project's build.fels.
(
  (source_file
    (function_declaration
      name: (identifier) @run @_main
      (#eq? @_main "main")))
  (#set! tag fels-main)
)
