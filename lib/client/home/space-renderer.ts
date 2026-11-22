import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  DataTexture,
  GLSL3,
  HalfFloatType,
  LinearFilter,
  Mesh,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { HOME_SCENE_CONFIG } from '@/lib/constants/home';
import { BLOOM_BLUR_FRAGMENT, BLOOM_EXTRACT_FRAGMENT, GRADE_FRAGMENT } from './space-postprocessing';

const VERTEX_SOURCE = `
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
const BLOOM_RADII = [3, 5, 7, 9];

export function createSpaceRenderer(canvas: HTMLCanvasElement, fragmentSource: string, blackbodyData: Uint8Array) {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });

  if (!context) {
    return null;
  }

  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: false, premultipliedAlpha: false });
  const targetType = renderer.extensions.has('EXT_color_buffer_float') ? HalfFloatType : UnsignedByteType;
  const materials: RawShaderMaterial[] = [];
  const targets: WebGLRenderTarget[] = [];
  const geometry = new BufferGeometry();
  const blackbody = new DataTexture(blackbodyData, 256, 1, RGBAFormat, UnsignedByteType);

  blackbody.minFilter = blackbody.magFilter = LinearFilter;
  blackbody.needsUpdate = true;
  geometry.setAttribute('a_position', new BufferAttribute(new Float32Array([-1, -1, 3, -1, -1, 3]), 2));
  geometry.setDrawRange(0, 3);

  function material(fragment: string, uniforms: RawShaderMaterial['uniforms']) {
    const result = new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: VERTEX_SOURCE,
      fragmentShader: fragment
        .replace('precision highp float;', 'precision highp float;\nout vec4 fragmentColor;')
        .replaceAll('texture2D(', 'texture(')
        .replaceAll('gl_FragColor', 'fragmentColor'),
      depthTest: false,
      depthWrite: false,
      uniforms: { uRes: { value: new Vector2() }, ...uniforms },
    });

    materials.push(result);

    return result;
  }

  const sceneMaterial = material(fragmentSource, {
    uTime: { value: 0 },
    uCam: { value: new Vector3() },
    uRight: { value: new Vector3() },
    uUp: { value: new Vector3() },
    uFwd: { value: new Vector3() },
    uTanHalf: { value: 0 },
    uRcam: { value: HOME_SCENE_CONFIG.camera.radius },
    uMaxSteps: { value: HOME_SCENE_CONFIG.rendering.maxSteps },
    uDisk: { value: HOME_SCENE_CONFIG.disk.opacity },
    uAccretion: { value: HOME_SCENE_CONFIG.disk.accretion },
    uTmax: { value: HOME_SCENE_CONFIG.disk.temperature },
    uFlare: { value: new Vector4(...HOME_SCENE_CONFIG.disk.flare) },
    uBB: { value: blackbody },
    uLensCenter: { value: new Vector2() },
    uLensScale: { value: 1 },
    uEnvironmentAngle: { value: 0 },
    uSrcZ: { value: HOME_SCENE_CONFIG.source.z },
    uSrcHalf: { value: new Vector2(...HOME_SCENE_CONFIG.source.halfSize) },
    uSrcDim: { value: HOME_SCENE_CONFIG.source.dim },
  });
  const extract = material(BLOOM_EXTRACT_FRAGMENT, {
    uImage: { value: null },
    uThreshold: { value: HOME_SCENE_CONFIG.rendering.bloom.threshold },
  });
  const blur = material(BLOOM_BLUR_FRAGMENT, {
    uImage: { value: null },
    uDirection: { value: new Vector2() },
    uTexel: { value: new Vector2() },
    uRadius: { value: 0 },
  });
  const grade = material(GRADE_FRAGMENT, {
    uImage: { value: null },
    uTime: { value: 0 },
    uExposure: { value: HOME_SCENE_CONFIG.rendering.exposure },
    uBloomStrength: { value: HOME_SCENE_CONFIG.rendering.bloom.strength },
    uBloomFactors: { value: new Vector4(...HOME_SCENE_CONFIG.rendering.bloom.factors) },
    uBloom0: { value: null },
    uBloom1: { value: null },
    uBloom2: { value: null },
    uBloom3: { value: null },
  });
  const quad = new Mesh(geometry, sceneMaterial);
  const scene = new Scene();
  const camera = new Camera();
  let image: WebGLRenderTarget;
  let bright: WebGLRenderTarget;
  let bloom: { horizontal: WebGLRenderTarget; vertical: WebGLRenderTarget }[] = [];

  quad.frustumCulled = false;
  scene.add(quad);

  function target(width: number, height: number) {
    const result = new WebGLRenderTarget(width, height, {
      type: targetType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    targets.push(result);

    return result;
  }

  function render(pass: RawShaderMaterial, output: WebGLRenderTarget | null) {
    pass.uniforms.uRes.value.set(output?.width ?? canvas.width, output?.height ?? canvas.height);
    quad.material = pass;
    renderer.setRenderTarget(output);
    renderer.render(scene, camera);
  }

  function resize() {
    targets.splice(0).forEach((image) => image.dispose());
    renderer.setSize(canvas.width, canvas.height, false);
    image = target(canvas.width, canvas.height);
    bright = target(Math.max(1, canvas.width >> 1), Math.max(1, canvas.height >> 1));
    bloom = BLOOM_RADII.map((_, level) => {
      const width = Math.max(1, canvas.width >> (level + 1));
      const height = Math.max(1, canvas.height >> (level + 1));

      return { horizontal: target(width, height), vertical: target(width, height) };
    });
  }

  function draw(seconds: number, environmentAngle = 0, anchor: HTMLDivElement | null = null) {
    const { camera } = HOME_SCENE_CONFIG;
    const uniforms = sceneMaterial.uniforms;
    const azimuth = (camera.azimuth * Math.PI) / 180;
    const elevation = (camera.elevation * Math.PI) / 180;
    const sinAz = Math.sin(azimuth),
      cosAz = Math.cos(azimuth);
    const sine = Math.sin(elevation),
      cosine = Math.cos(elevation);
    const lensBounds = anchor?.getBoundingClientRect();
    const lensRotation = (-HOME_SCENE_CONFIG.presentation.rotation * Math.PI) / 180;
    const lensExtent = Math.abs(Math.cos(lensRotation)) + Math.abs(Math.sin(lensRotation));
    const lensHeight = lensBounds ? lensBounds.height / lensExtent : window.innerHeight;

    uniforms.uLensCenter.value.set(
      lensBounds ? ((lensBounds.left + lensBounds.width / 2 - window.innerWidth / 2) * 2) / window.innerHeight : 0,
      lensBounds ? ((window.innerHeight / 2 - lensBounds.top - lensBounds.height / 2) * 2) / window.innerHeight : 0,
    );
    uniforms.uLensScale.value = lensHeight / window.innerHeight;
    uniforms.uEnvironmentAngle.value = environmentAngle;
    uniforms.uTime.value = seconds;
    uniforms.uCam.value.set(camera.radius * sinAz * cosine, camera.radius * sine, camera.radius * cosAz * cosine);
    uniforms.uRight.value.set(cosAz, 0, -sinAz);
    uniforms.uUp.value.set(-sinAz * sine, cosine, -cosAz * sine);
    uniforms.uFwd.value.set(-sinAz * cosine, -sine, -cosAz * cosine);
    uniforms.uTanHalf.value = Math.tan((camera.verticalFov * Math.PI) / 360);
    render(sceneMaterial, image);

    extract.uniforms.uImage.value = image.texture;
    render(extract, bright);
    let input = bright;

    bloom.forEach(({ horizontal, vertical }, level) => {
      blur.uniforms.uImage.value = input.texture;
      blur.uniforms.uTexel.value.set(1 / input.width, 1 / input.height);
      blur.uniforms.uDirection.value.set(1, 0);
      blur.uniforms.uRadius.value = BLOOM_RADII[level];
      render(blur, horizontal);
      blur.uniforms.uImage.value = horizontal.texture;
      blur.uniforms.uTexel.value.set(1 / horizontal.width, 1 / horizontal.height);
      blur.uniforms.uDirection.value.set(0, 1);
      render(blur, vertical);
      input = vertical;
    });
    grade.uniforms.uImage.value = image.texture;
    bloom.forEach(({ vertical }, level) => {
      grade.uniforms[`uBloom${level}`].value = vertical.texture;
    });
    grade.uniforms.uTime.value = seconds;
    render(grade, null);
  }

  function dispose() {
    targets.forEach((image) => image.dispose());
    materials.forEach((pass) => pass.dispose());
    geometry.dispose();
    blackbody.dispose();
    renderer.dispose();
  }

  return { resize, draw, dispose };
}
