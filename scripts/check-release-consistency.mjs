import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import process from 'node:process';

const packageMetadata = JSON.parse(await readFile('package.json', 'utf8'));
const dependencies = packageMetadata.devDependencies;
const version = packageMetadata.version;
const pinnedPackage = `${packageMetadata.name}@${version}`;
const docsBrandName = 'Teachable Machine';
const errors = [];

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  errors.push(`package.json contains an invalid version: ${version}`);
}

const readme = await readFile('README.md', 'utf8');
if (readme.split(pinnedPackage).length - 1 < 2) {
  errors.push(`README.md must contain version-pinned install and CDN examples for ${pinnedPackage}`);
}
if (!readme.includes('MPL-2.0')) {
  errors.push('README.md must identify the package license as SPDX MPL-2.0');
}

for (const path of ['docs/index.html', 'docs/ja/index.html']) {
  const source = await readFile(path, 'utf8');
  if (
    source.split(`v${version}`).length - 1 !== 1 ||
    !source.includes(`${docsBrandName} ${version}`)
  ) {
    errors.push(`${path} must expose version ${version} in the badge and accessible brand label`);
  }
}

for (const path of ['dist/tm.js', 'dist/composition.js']) {
  const source = await readFile(path, 'utf8');
  if (!source.includes(`version = "${version}"`)) {
    errors.push(`${path} must embed package version ${version}`);
  }
  if (!source.includes('packageMetadata.version}-typescript')) {
    errors.push(`${path} must derive the runtime version from package metadata`);
  }
}

const browserRuntime = await readFile('dist/runtime.js', 'utf8');
if (!browserRuntime.includes(`version:"${version}"`)) {
  errors.push(`dist/runtime.js must embed package version ${version}`);
}
if (
  !browserRuntime.startsWith(
    `/*! @license Includes TensorFlow.js ${dependencies['@tensorflow/tfjs']}`
  ) ||
  !browserRuntime.includes(
    `Speech Commands ${dependencies['@tensorflow-models/speech-commands']}`
  ) ||
  !browserRuntime.includes(`PoseNet ${dependencies['@tensorflow-models/posenet']}`) ||
  !browserRuntime.includes(`/blob/v${version}/THIRD_PARTY_NOTICES.md`)
) {
  errors.push('dist/runtime.js must retain the versioned third-party license notice');
}
if (
  browserRuntime.split(' has already been set. Overwriting the platform with ').length - 1 !== 1 ||
  browserRuntime.split(' backend was already registered. Reusing existing backend factory.').length -
    1 !==
    1
) {
  errors.push('dist/runtime.js must contain one TensorFlow.js browser platform and WebGL backend');
}

// The optional backends resolve TensorFlow.js against the runtime's global
// instance, so a second copy of the core would show up as its own registry.
for (const [path, component] of [
  ['dist/backend-wasm.js', `TensorFlow.js WASM backend ${dependencies['@tensorflow/tfjs-backend-wasm']}`],
  [
    'dist/backend-webgpu.js',
    `TensorFlow.js WebGPU backend ${dependencies['@tensorflow/tfjs-backend-webgpu']}`
  ]
]) {
  const bundle = await readFile(path, 'utf8');
  if (!bundle.startsWith(`/*! @license Includes ${component} (Apache-2.0).`)) {
    errors.push(`${path} must start with the versioned third-party license notice`);
  }
  if (!bundle.includes(`/blob/v${version}/THIRD_PARTY_NOTICES.md`)) {
    errors.push(`${path} must link the ${version} third-party notice`);
  }
  if (bundle.includes(' has already been set. Overwriting the platform with ')) {
    errors.push(`${path} must not bundle a second TensorFlow.js core`);
  }
}

const wasmFiles = [
  {
    path: 'tfjs-backend-wasm.wasm',
    size: 311_123,
    sha256: '70a5d516060464e5269f01c74bac1772d6b8ab6cb612acf16b5cdaf61f78d892'
  },
  {
    path: 'tfjs-backend-wasm-simd.wasm',
    size: 424_594,
    sha256: '77ebb28a6d34f371dbbf2086b7f2de8994acd8ea5a3cf1fa24d2c26c840cac7b'
  },
  {
    path: 'tfjs-backend-wasm-threaded-simd.wasm',
    size: 435_643,
    sha256: 'c052228d4bef185c27bbe59a9e029570c78bbb9f08b3cb46b597851650373de2'
  },
  {
    path: 'tfjs-backend-wasm-threaded-simd.worker.js',
    size: 3_115,
    sha256: '2d56f7279a8515423f59e3a8a5793d27aee4fcf4c9f955c28c6d38a4462f9472'
  }
];
for (const expected of wasmFiles) {
  const path = `dist/wasm/${expected.path}`;
  const bytes = await readFile(path);
  if (
    bytes.byteLength !== expected.size ||
    createHash('sha256').update(bytes).digest('hex') !== expected.sha256
  ) {
    errors.push(`${path} must match the pinned TensorFlow.js WASM supply`);
  }
}

const notices = await readFile('THIRD_PARTY_NOTICES.md', 'utf8');
const distributedNotices = await readFile('dist/THIRD_PARTY_NOTICES.md', 'utf8');
if (notices !== distributedNotices) {
  errors.push('dist/THIRD_PARTY_NOTICES.md must match the repository notice');
}

const license = await readFile('LICENSE', 'utf8');
if (!license.startsWith('Mozilla Public License Version 2.0')) {
  errors.push('LICENSE must contain the Mozilla Public License Version 2.0 full text');
}

for (const path of ['.github/workflows/ci.yml', '.github/workflows/release.yml']) {
  const source = await readFile(path, 'utf8');
  const legacyArchiveName = 'turbowarp-' + 'tm' + 'pose';
  const legacyBundlePath = 'dist/' + 'tm' + 'pose.js';
  if (source.includes(legacyArchiveName) || source.includes(legacyBundlePath)) {
    errors.push(`${path} must publish TurboWarp TM artifact names`);
  }
}

const poseNetModule = await readFile('dist/posenet.js', 'utf8');
if (
  !poseNetModule.includes(`version = "${version}"`) ||
  !poseNetModule.includes('version: packageMetadata.version')
) {
  errors.push(`dist/posenet.js must embed package version ${version}`);
}

const poseNetFiles = [
  {
    path: 'model-stride16.json',
    size: 49_720,
    sha256: 'dd63bf2d3b983e8c80020749f135164beda00a33374c8a7be230b9598f24f798'
  },
  {
    path: 'group1-shard1of2.bin',
    size: 4_194_304,
    sha256: 'ce6afc62f89782d43139fab76c641b281a82dee2cd2759aa036c4b28aea16439'
  },
  {
    path: 'group1-shard2of2.bin',
    size: 838_476,
    sha256: '2a35b8cfb86eb50928931e03dc30c0972fdd375f148b177ee40676b81a17692d'
  }
];
for (const expected of poseNetFiles) {
  const path = `dist/posenet/mobilenet-v1-075-stride16/${expected.path}`;
  const bytes = await readFile(path);
  if (
    bytes.byteLength !== expected.size ||
    createHash('sha256').update(bytes).digest('hex') !== expected.sha256
  ) {
    errors.push(`${path} must match the pinned PoseNet model supply`);
  }
}

if (process.env.GITHUB_REF_TYPE === 'tag') {
  const expectedTag = `v${version}`;
  if (process.env.GITHUB_REF_NAME !== expectedTag) {
    errors.push(`release tag ${process.env.GITHUB_REF_NAME ?? '<missing>'} must equal ${expectedTag}`);
  }
}

if (errors.length > 0) {
  throw new Error(`Release consistency check failed:\n- ${errors.join('\n- ')}`);
}

process.stdout.write(`Release metadata is aligned with ${version}.\n`);
