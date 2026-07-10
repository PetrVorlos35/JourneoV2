// Holds the single most recent undoable action, shared app-wide.
// Both entry points — the delete toast's "Undo" button and the global
// Cmd/Ctrl+Z handler in DashboardLayout — consume the same action object,
// so the undo logic lives in one place (whoever pushes it).
//
// Shape: { undo: () => Promise }. The action is single-shot: takeUndo()
// pops it, and an action should call clearUndo(itself) when it runs or
// becomes invalid (e.g. the underlying delete failed).

let current = null;

export const pushUndo = (action) => {
  current = action;
};

export const takeUndo = () => {
  const action = current;
  current = null;
  return action;
};

export const clearUndo = (action) => {
  if (current === action) current = null;
};
