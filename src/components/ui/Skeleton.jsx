/**
 * Base skeleton primitive. Renders a shimmering placeholder block.
 * Compose these to match the shape of the content being loaded.
 *
 * Usage: <Skeleton className="h-4 w-32 rounded-lg" />
 */
const Skeleton = ({ className = '', rounded = 'rounded-xl', style }) => (
  <div className={`skeleton ${rounded} ${className}`} style={style} aria-hidden="true" />
);

export default Skeleton;
