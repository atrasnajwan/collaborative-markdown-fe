// it used for binding 'monaco-editor/esm/vs/editor/editor.api.js' to global monaco that load from cdn
const monaco = (window as any).monaco

if (!monaco) {
  throw new Error('Monaco must be loaded before importing y-monaco')
}

export const Selection = monaco.Selection
export const Range = monaco.Range
export const SelectionDirection = monaco.SelectionDirection
export const Position = monaco.Position
export const Uri = monaco.Uri
export const editor = monaco.editor

export default monaco
