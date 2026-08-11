const CHIP_TOKENS = ['bg', 'ink', 'kw', 'str', 'fn', 'num', 'type', 'builtin'];
const CODE_SEGMENTS = [
  ['def', 'kw'], [' ', 'ink'], ['total', 'fn'], ['(', 'punct'], ['cents', 'type'],
  [')', 'punct'], [' ', 'ink'], ['=', 'punct'], [' ', 'ink'], ['cents', 'ink'],
  [' ', 'ink'], ['/', 'punct'], [' ', 'ink'], ['100.0', 'num'],
];
const REQUIRED_TOKENS = [...new Set(['border', 'faint', ...CHIP_TOKENS, ...CODE_SEGMENTS.map(([, token]) => token)])];
const CODE_ADVANCE = 7.8;

function escapeXml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;',
  })[character]);
}

function requireThemeValue(theme, key) {
  if (!theme || typeof theme[key] !== 'string' || !theme[key]) {
    throw new Error(`Missing required theme ${key}`);
  }
}

function requireThemeColors(theme) {
  if (!theme?.colors || typeof theme.colors !== 'object') {
    throw new Error('Missing required theme colors');
  }
  for (const token of REQUIRED_TOKENS) {
    if (typeof theme.colors[token] !== 'string' || !theme.colors[token]) {
      throw new Error(`Missing required color token '${token}'`);
    }
  }
}

function startTag(content) {
  const name = /^([A-Za-z_][\w:.-]*)/.exec(content)?.[1];
  if (!name) throw new Error(`Invalid XML tag: <${content}>`);
  let index = name.length;
  let selfClosing = false;

  while (index < content.length) {
    while (/\s/.test(content[index] ?? '')) index += 1;
    if (content[index] === '/') {
      if (content.slice(index) !== '/') throw new Error(`Invalid XML tag: <${content}>`);
      selfClosing = true;
      break;
    }
    if (index === content.length) break;
    const attribute = /^([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/.exec(content.slice(index));
    if (!attribute) throw new Error(`Invalid XML attribute in <${content}>`);
    index += attribute[0].length;
  }

  return { name, selfClosing };
}

function assertTextIsEscaped(text) {
  if (/[<>]/.test(text)) throw new Error('Unescaped XML markup');
  const unescapedAmpersand = text.replace(/&(amp|apos|quot|lt|gt|#\d+|#x[\da-fA-F]+);/g, '').includes('&');
  if (unescapedAmpersand) throw new Error('Unescaped XML entity');
}

// Small XML parser for the deliberately limited, self-contained SVG we emit.
export function assertWellFormedXml(xml) {
  if (typeof xml !== 'string' || !xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')) {
    throw new Error('Missing XML declaration');
  }

  const stack = [];
  let rootName;
  let rootClosed = false;
  const tagPattern = /<([^<>]+)>/g;
  let cursor = 0;
  for (const match of xml.matchAll(tagPattern)) {
    const text = xml.slice(cursor, match.index);
    assertTextIsEscaped(text);
    if (rootClosed && text.trim()) throw new Error('Text after XML root element');
    cursor = match.index + match[0].length;
    const content = match[1];
    if (content === '?xml version="1.0" encoding="UTF-8"?') continue;
    if (content.startsWith('/')) {
      const name = /^\/([A-Za-z_][\w:.-]*)$/.exec(content)?.[1];
      if (!name || stack.pop() !== name) throw new Error(`Mismatched XML closing tag: <${content}>`);
      if (!stack.length) rootClosed = true;
      continue;
    }
    const { name, selfClosing } = startTag(content);
    if (rootClosed || (rootName && !stack.length)) throw new Error('Multiple XML root elements');
    if (!rootName) rootName = name;
    if (!selfClosing) stack.push(name);
    else if (!stack.length) rootClosed = true;
  }
  const text = xml.slice(cursor);
  assertTextIsEscaped(text);
  if (rootClosed && text.trim()) throw new Error('Text after XML root element');
  if (!rootName) throw new Error('Missing XML root element');
  if (stack.length) throw new Error(`Unclosed XML tag: <${stack.at(-1)}>`);
}

export function swatchSvg(theme, options = {}) {
  requireThemeValue(theme, 'name');
  requireThemeValue(theme, 'tone');
  requireThemeColors(theme);

  const width = options.width ?? 480;
  const height = options.height ?? 150;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Swatch dimensions must be positive numbers');
  }

  const { colors } = theme;
  const chips = CHIP_TOKENS.map((token, index) => {
    const x = 16 + index * 29;
    return `    <g><title>${token}</title><rect x="${x}" y="72" width="22" height="22" rx="4" fill="${colors[token]}" stroke="${colors.border}"/></g>`;
  });
  let codeX = 16;
  const code = CODE_SEGMENTS.map(([text, token]) => {
    const part = `    <text x="${codeX}" y="128" fill="${colors[token]}">${text}</text>`;
    codeX += text.length * CODE_ADVANCE;
    return part;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="swatch-title">`,
    `  <title id="swatch-title">Candela ${escapeXml(theme.name)}, ${escapeXml(theme.tone)}</title>`,
    `  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${colors.bg}" stroke="${colors.border}"/>`,
    `  <text x="16" y="30" fill="${colors.ink}" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="15" font-weight="700">${escapeXml(theme.name)}</text>`,
    `  <text x="${width - 16}" y="30" fill="${colors.faint}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" text-anchor="end">${escapeXml(theme.tone)}</text>`,
    `  <path d="M 1 55.5 H ${width - 1}" stroke="${colors.border}"/>`,
    '  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13">',
    ...chips,
    ...code,
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}
