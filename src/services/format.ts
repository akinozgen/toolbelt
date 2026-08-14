import { invoke } from '@tauri-apps/api/core';

export type FormatLang = 'JSON' | 'HTML' | 'CSS' | 'JS' | 'XML' | 'YAML';

export interface FormatOptions {
  printWidth: number;
  tabWidth: number;
  singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  xmlPrintWidth: number;
}

type PrettierFormat = (source: string, options: any) => Promise<string>;
type PrettierPlugins = {
  parserBabel: any;
  parserEstree: any;
  parserHtml: any;
  parserPostcss: any;
  parserTypescript: any;
};

let _prettierFormat: PrettierFormat | null = null;
let _prettierPlugins: PrettierPlugins | null = null;

async function loadPrettier(): Promise<{ format: PrettierFormat; plugins: PrettierPlugins }> {
  if (_prettierFormat && _prettierPlugins) {
    return { format: _prettierFormat, plugins: _prettierPlugins };
  }
  const getDefault = (m: any) => m?.default ?? m;
  const [standalone, babel, estree, html, postcss, typescript] = await Promise.all([
    import('prettier/standalone.mjs'),
    import('prettier/plugins/babel.mjs'),
    import('prettier/plugins/estree.mjs'),
    import('prettier/plugins/html.mjs'),
    import('prettier/plugins/postcss.mjs'),
    import('prettier/plugins/typescript.mjs'),
  ]);
  _prettierFormat = standalone.format as PrettierFormat;
  _prettierPlugins = {
    parserBabel: getDefault(babel),
    parserEstree: getDefault(estree),
    parserHtml: getDefault(html),
    parserPostcss: getDefault(postcss),
    parserTypescript: getDefault(typescript),
  };
  return { format: _prettierFormat, plugins: _prettierPlugins };
}

export async function format(lang: FormatLang, source: string, opts: FormatOptions): Promise<string> {
  if (!source.trim()) return '';

  if (lang === 'JSON') {
    return invoke<string>('format_json', { input: source, indent: opts.tabWidth });
  }
  if (lang === 'YAML') {
    return invoke<string>('format_yaml', { input: source, indent: opts.tabWidth });
  }
  if (lang === 'XML') {
    return invoke<string>('format_xml', { input: source, indent: opts.tabWidth });
  }

  const { format: prettierFormat, plugins } = await loadPrettier();
  const baseOpts = {
    printWidth: opts.printWidth,
    tabWidth: opts.tabWidth,
    semi: true,
    singleQuote: opts.singleQuote,
    trailingComma: opts.trailingComma,
  };

  if (lang === 'JS') {
    return prettierFormat(source, {
      ...baseOpts,
      parser: 'typescript',
      plugins: [plugins.parserTypescript, plugins.parserEstree],
    });
  }
  if (lang === 'HTML') {
    return prettierFormat(source, {
      ...baseOpts,
      parser: 'html',
      plugins: [plugins.parserHtml],
    });
  }
  if (lang === 'CSS') {
    return prettierFormat(source, {
      ...baseOpts,
      parser: 'css',
      plugins: [plugins.parserPostcss],
    });
  }
  return source;
}
