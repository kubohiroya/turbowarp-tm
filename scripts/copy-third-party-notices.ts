import {copyFile, readFile, writeFile} from 'node:fs/promises';

interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  packageManager?: string;
  engines?: {node?: string};
  repository?: {url?: string};
  bugs?: {url?: string};
  files?: string[];
  bin?: string | Record<string, string>;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const packageMetadata = JSON.parse(await readFile('package.json', 'utf8')) as PackageMetadata;
const dependencies = packageMetadata.devDependencies;
const noticeUrl =
  `https://github.com/kubohiroya/turbowarp-tm/blob/v${packageMetadata.version}/` +
  'THIRD_PARTY_NOTICES.md';

function banner(components) {
  const list = components.slice(0, -1).join(', ');
  const last = components[components.length - 1];
  const subject = components.length > 1 ? `${list}, and ${last}` : last;
  return `/*! @license Includes ${subject} (Apache-2.0). See ${noticeUrl}. */\n`;
}

const artifacts = [
  {
    path: 'dist/runtime.js',
    banner: banner([
      `TensorFlow.js ${dependencies['@tensorflow/tfjs']}`,
      `Speech Commands ${dependencies['@tensorflow-models/speech-commands']}`,
      `Teachable Machine Pose ${dependencies['@teachablemachine/pose']}`,
      `Teachable Machine Image ${dependencies['@teachablemachine/image']}`,
      `PoseNet ${dependencies['@tensorflow-models/posenet']}`
    ])
  },
  {
    path: 'dist/backend-wasm.js',
    banner: banner([
      `TensorFlow.js WASM backend ${dependencies['@tensorflow/tfjs-backend-wasm']}`
    ])
  },
  {
    path: 'dist/backend-webgpu.js',
    banner: banner([
      `TensorFlow.js WebGPU backend ${dependencies['@tensorflow/tfjs-backend-webgpu']}`
    ])
  }
];

for (const artifact of artifacts) {
  const source = await readFile(artifact.path, 'utf8');
  if (!source.startsWith(artifact.banner)) {
    await writeFile(artifact.path, artifact.banner + source);
  }
}

await copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
