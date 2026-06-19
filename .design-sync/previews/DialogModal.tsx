import { DialogModal } from 'journeov2';

// DialogModal is an animated overlay (portals to document.body, fixed inset-0,
// framer-motion spring entry). It's driven open with isOpen + a config object.
//
// Single cell by necessity: rendered with cardMode "single" so the open state
// fills the card, and exactly ONE export because (a) two `fixed inset-0` modals
// would overlap in one cell, and (b) the capture harness's deterministic clock
// leaves the SECOND framer-animated cell on a reused page unsettled (blank).
// See .design-sync/NOTES.md "Re-sync risks". Handlers are no-ops.

const noop = () => {};

export const Danger = () => (
  <DialogModal
    isOpen={true}
    config={{
      type: 'confirm',
      variant: 'danger',
      title: 'Delete this trip?',
      message: 'This permanently removes “Kyoto in Spring” and everything planned inside it. This can’t be undone.',
      confirmLabel: 'Delete trip',
      cancelLabel: 'Keep it',
    }}
    onConfirm={noop}
    onCancel={noop}
    onClose={noop}
  />
);
