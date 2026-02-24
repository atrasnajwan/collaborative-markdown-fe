// it used for binding 'monaco-editor/esm/vs/editor/editor.api.js' to global monaco that load from cdn
const getMonaco = () => {
  const monaco = (window as any).monaco
  if (!monaco) {
    // Instead of throwing, we return log
    // allows y-monaco to initialize without crashing the whole script
    console.warn('y-monaco tried to access Monaco before it was ready.')
  }
  return monaco
}

export const Selection = getMonaco()?.Selection
export const Range = getMonaco()?.Range
export const SelectionDirection = getMonaco()?.SelectionDirection
export const Position = getMonaco()?.Position
export const Uri = getMonaco()?.Uri

export const editor = new Proxy(
  {},
  {
    get: (_, prop) => getMonaco()?.editor[prop],
  }
)

export default new Proxy(
  {},
  {
    get: (_, prop) => getMonaco()?.[prop],
  }
)
