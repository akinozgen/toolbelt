import { invoke } from '@tauri-apps/api/core';

export type SortMode = 'alpha' | 'numeric' | 'length';
export interface SortOpts {
  input: string;
  mode?: SortMode;
  descending?: boolean;
  case_sensitive?: boolean;
}

export interface DedupeOpts {
  input: string;
  preserve_order?: boolean;
  trim_compare?: boolean;
  case_insensitive?: boolean;
}

export type CaseTarget =
  | 'lower' | 'upper' | 'title' | 'sentence'
  | 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'dot';
export interface CaseOpts { input: string; target: CaseTarget }

export type EscapeKind = 'json' | 'html' | 'regex' | 'shell' | 'sql' | 'url';
export interface EscapeOpts { input: string; kind: EscapeKind }

export interface SlugifyOpts {
  input: string;
  ascii_only?: boolean;
  separator?: string;
}

export interface CountResult {
  chars: number;
  bytes: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
}

export type TrimMode = 'both' | 'left' | 'right' | 'lines';
export interface TrimOpts { input: string; mode?: TrimMode; chars?: string }

export const text = {
  sort:     (opts: SortOpts)      => invoke<string>('text_sort',     { opts }),
  dedupe:   (opts: DedupeOpts)    => invoke<string>('text_dedupe',   { opts }),
  case:     (opts: CaseOpts)      => invoke<string>('text_case',     { opts }),
  escape:   (opts: EscapeOpts)    => invoke<string>('text_escape',   { opts }),
  unescape: (opts: EscapeOpts)    => invoke<string>('text_unescape', { opts }),
  slugify:  (opts: SlugifyOpts)   => invoke<string>('text_slugify',  { opts }),
  markdown: (input: string)       => invoke<string>('text_markdown_to_html', { input }),
  count:    (input: string)       => invoke<CountResult>('text_count', { input }),
  trim:     (opts: TrimOpts)      => invoke<string>('text_trim',     { opts }),
};
