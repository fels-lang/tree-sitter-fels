// External scanner for the Fels grammar.
//
// It has one job: tell the opening `|` of a payload capture from the bitwise
// or operator. The compiler parser uses a lookahead of four tokens for this:
// a `|` followed by an identifier, another `|` and a `{` starts a capture, as in
//
//     if e == .code |c| { ... }
//
// The scanner reads the same shape and only consumes the first `|`.

#include "tree_sitter/parser.h"

#include <stdbool.h>
#include <stdint.h>

enum TokenType {
  CAPTURE_OPEN,
};

void *tree_sitter_fels_external_scanner_create(void) { return NULL; }
void tree_sitter_fels_external_scanner_destroy(void *payload) { (void)payload; }
unsigned tree_sitter_fels_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}
void tree_sitter_fels_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

static bool is_space(int32_t c) { return c == ' ' || c == '\t' || c == '\n' || c == '\r'; }
static bool is_ident_start(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '@';
}
static bool is_ident_part(int32_t c) { return is_ident_start(c) || (c >= '0' && c <= '9'); }

static void skip_space(TSLexer *lexer, bool skip) {
  while (is_space(lexer->lookahead)) lexer->advance(lexer, skip);
}

bool tree_sitter_fels_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;
  if (!valid_symbols[CAPTURE_OPEN]) return false;

  skip_space(lexer, true);
  if (lexer->lookahead != '|') return false;
  lexer->advance(lexer, false);
  lexer->mark_end(lexer);
  lexer->result_symbol = CAPTURE_OPEN;

  skip_space(lexer, false);
  if (!is_ident_start(lexer->lookahead)) return false;
  lexer->advance(lexer, false);
  while (is_ident_part(lexer->lookahead)) lexer->advance(lexer, false);
  skip_space(lexer, false);
  if (lexer->lookahead != '|') return false;
  lexer->advance(lexer, false);
  skip_space(lexer, false);
  return lexer->lookahead == '{';
}
