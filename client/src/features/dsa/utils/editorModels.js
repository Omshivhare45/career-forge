// Monaco owns the undo stack on the text model. Keep a small working set
// of detached models and remember the editor's cursor, selection and scroll.
const recent = new Map();

export function retainEditorModels(editor) {
  function remember() {
    const model = editor.getModel();
    if (!model) return;
    const key = model.uri.toString();
    recent.delete(key);
    recent.set(key, { model, view: editor.saveViewState() });
    for (const [oldKey, entry] of recent) {
      if (recent.size <= 12) break;
      if (!entry.model.isAttachedToEditor()) {
        entry.model.dispose();
        recent.delete(oldKey);
      }
    }
  }
  function restore() {
    const saved = recent.get(editor.getModel()?.uri.toString());
    if (saved?.view) editor.restoreViewState(saved.view);
  }
  restore();
  const before = editor.onWillChangeModel(remember);
  const after = editor.onDidChangeModel(restore);
  return () => {
    remember();
    before.dispose();
    after.dispose();
  };
}
