import { SpaceCanvas } from './space-canvas';

export function HomeStarfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <SpaceCanvas layer="background" />
    </div>
  );
}
