const RESOURCE_BASE = '/home/event-horizon';

export async function loadHomeResources(signal: AbortSignal) {
  const [background, horizon, blackbody] = await Promise.all(
    ['lens.glsl', 'blackhole.glsl', 'blackbody.rgba'].map(async (name) => {
      const response = await fetch(`${RESOURCE_BASE}/${name}`, { signal });

      if (!response.ok) {
        throw new Error(`Unable to load home resource: ${name}`);
      }

      return response;
    }),
  );
  const [backgroundShader, horizonShader, blackbodyBuffer] = await Promise.all([
    background.text(),
    horizon.text(),
    blackbody.arrayBuffer(),
  ]);

  return { backgroundShader, horizonShader, blackbodyData: new Uint8Array(blackbodyBuffer) };
}
