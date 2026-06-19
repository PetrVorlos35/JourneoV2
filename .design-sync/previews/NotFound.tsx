import { NotFound } from 'journeov2';

// Full-page 404 screen: floating navbar, giant "404" watermark, compass icon,
// localized title + description. framer-motion entry animation → single cell,
// rendered at a tall viewport so the whole composition is visible.

export const Default = () => <NotFound />;
