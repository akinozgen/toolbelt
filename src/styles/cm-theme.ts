import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Toolbelt CodeMirror themes — surface and accent track app tokens
 * via CSS variables, so they re-tint when the user switches theme/accent.
 *
 * Usage:
 *   const exts = [toolbeltCmTheme, syntaxHighlighting(toolbeltSyntax(isDark))]
 */

export const toolbeltCmTheme = EditorView.theme({
  '&': {
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--editor-font-size)',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
    padding: 'var(--space-3) 0',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    border: 'none',
    borderRight: '1px solid var(--border-subtle)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
  '.cm-selectionMatch': { backgroundColor: 'var(--accent-subtle)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--accent-subtle)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'var(--accent-tint)',
    outline: '1px solid var(--accent)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'var(--accent-subtle)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderTop: '1px solid var(--border-subtle)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-flyout)',
    color: 'var(--text-primary)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  },
});

/**
 * Single highlight style that works for both themes — colors are picked to
 * have decent contrast on both #202020 dark and #FBFBFB light surfaces.
 * If you want sharper per-theme palettes later, split into two HighlightStyles
 * and pick by `isDark` at apply time.
 */
export const toolbeltSyntax = HighlightStyle.define([
  { tag: t.keyword,                     color: '#C586C0', fontWeight: '600' },
  { tag: [t.controlKeyword, t.moduleKeyword], color: '#C586C0', fontWeight: '600' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: 'var(--text-primary)' },
  { tag: [t.propertyName],              color: '#9CDCFE' },
  { tag: [t.function(t.variableName), t.labelName], color: '#DCDCAA' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#4FC1FF' },
  { tag: [t.definition(t.name), t.separator], color: 'var(--text-primary)' },
  { tag: [t.typeName, t.className],     color: '#4EC9B0' },
  { tag: [t.number, t.changed, t.annotation, t.modifier, t.self], color: '#B5CEA8' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link], color: '#D4D4D4' },
  { tag: [t.meta, t.comment],           color: 'var(--text-tertiary)', fontStyle: 'italic' },
  { tag: t.strong,                      fontWeight: 'bold' },
  { tag: t.emphasis,                    fontStyle: 'italic' },
  { tag: t.strikethrough,               textDecoration: 'line-through' },
  { tag: t.link,                        color: 'var(--accent)', textDecoration: 'underline' },
  { tag: t.heading,                     fontWeight: 'bold', color: '#569CD6' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#569CD6' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#CE9178' },
  { tag: t.invalid,                     color: 'var(--danger)' },
]);

/** Combined extension array — drop-in replacement for `oneDark`. */
export const toolbeltCm = [toolbeltCmTheme, syntaxHighlighting(toolbeltSyntax)];
