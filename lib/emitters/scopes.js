// TextMate scope -> Candela token. Shared by the two emitters that speak
// TextMate: VS Code (tokenColors) and Sublime Text (rules).

export const TOKEN_SCOPES = [
  { token: 'kw', scopes: ['keyword', 'storage'] },
  { token: 'str', scopes: ['string'] },
  { token: 'fn', scopes: ['entity.name.function', 'support.function'] },
  { token: 'num', scopes: ['constant.numeric', 'constant.language'] },
  { token: 'type', scopes: ['entity.name.type', 'entity.name.class', 'support.type'] },
  { token: 'builtin', scopes: ['support', 'variable.language', 'constant.other.symbol'] },
  { token: 'punct', scopes: ['punctuation', 'keyword.operator'] },
  { token: 'faint', scopes: ['comment'], fontStyle: 'italic' },
  // `entity.name.type` does not prefix-match `entity.name.tag`, so without these two
  // an HTML/JSX tag, a CSS selector and every YAML key (scoped entity.name.tag.yaml)
  // render as plain `ink`. Namespaces are listed for the same reason.
  { token: 'type', scopes: ['entity.name.tag', 'entity.name.namespace'] },
  { token: 'builtin', scopes: ['entity.other.attribute-name'] },
  { token: 'num', scopes: ['constant.character.escape'] },
  { token: 'error', scopes: ['invalid'] },
  // Prose grammars (Markdown, reST, AsciiDoc) live entirely in markup.*; without
  // these a .md file renders as one flat block of `ink`, since none of the code
  // scopes above ever match. Listed last so they win over `punctuation`/`string`.
  { token: 'fn', scopes: ['markup.heading', 'entity.name.section'], fontStyle: 'bold' },
  { token: 'kw', scopes: ['markup.bold'], fontStyle: 'bold' },
  { token: 'kw', scopes: ['markup.italic'], fontStyle: 'italic' },
  { token: 'builtin', scopes: ['markup.raw', 'markup.inline.raw'] },
  { token: 'fn', scopes: ['markup.underline.link', 'string.other.link'], fontStyle: 'underline' },
  { token: 'faint', scopes: ['markup.quote'], fontStyle: 'italic' },
  { token: 'ok', scopes: ['markup.inserted'] },
  { token: 'error', scopes: ['markup.deleted'] },
  { token: 'warning', scopes: ['markup.changed'] },
];
