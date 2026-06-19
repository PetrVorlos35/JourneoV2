import { LocationAutocomplete } from 'journeov2';

// A location text field with geo-autocomplete (queries Nominatim on type). The
// suggestion dropdown only appears after async results, so previews show the
// resting states: empty with placeholder, and pre-filled with a destination.

const Frame = ({ children }: { children: any }) => (
  <div style={{ background: '#0a0a0a', padding: 28, width: 380 }}>{children}</div>
);

export const Empty = () => (
  <Frame>
    <LocationAutocomplete value="" onChange={() => {}} placeholder="Where to next?" />
  </Frame>
);

export const Filled = () => (
  <Frame>
    <LocationAutocomplete value="Kyoto, Japan" onChange={() => {}} placeholder="Where to next?" />
  </Frame>
);
