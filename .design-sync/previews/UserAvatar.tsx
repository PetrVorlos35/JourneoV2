import { UserAvatar } from 'journeov2';

// UserAvatar shows a user's initials, or a travel preset icon when
// user.avatar_url matches a preset (mountain/beach/city/forest/travel/photography).
// Sizes: sm | md | lg | xl. Pure CSS + lucide icons, so multiple cells are fine.

const Row = ({ children }: { children: any }) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 24, background: '#0a0a0a' }}>{children}</div>
);

export const Sizes = () => (
  <Row>
    <UserAvatar user={{ first_name: 'Petr', last_name: 'Vorel' }} size="sm" />
    <UserAvatar user={{ first_name: 'Petr', last_name: 'Vorel' }} size="md" />
    <UserAvatar user={{ first_name: 'Petr', last_name: 'Vorel' }} size="lg" />
    <UserAvatar user={{ first_name: 'Petr', last_name: 'Vorel' }} size="xl" />
  </Row>
);

export const Presets = () => (
  <Row>
    <UserAvatar user={{ avatar_url: 'mountain' }} size="lg" />
    <UserAvatar user={{ avatar_url: 'beach' }} size="lg" />
    <UserAvatar user={{ avatar_url: 'city' }} size="lg" />
    <UserAvatar user={{ avatar_url: 'travel' }} size="lg" />
    <UserAvatar user={{ avatar_url: 'photography' }} size="lg" />
  </Row>
);
