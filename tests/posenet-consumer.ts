import {
  createBundledTMRuntime,
  createPoseNetProjectBundleFromLoader,
  loadPoseNetBundle,
  poseNetBundleManifest,
  type PoseNetBundleFileLoader,
  type PoseNetProjectBundle,
  type TMRuntimeLoadOptions,
  type TMBrowserRuntime
} from '@kubohiroya/turbowarp-tm/posenet';

const loadFile: PoseNetBundleFileLoader = async (file) => {
  const specifier: string = file.packageSpecifier;
  void specifier;
  return new Uint8Array(file.size);
};

void loadPoseNetBundle(loadFile);
void createPoseNetProjectBundleFromLoader(loadFile);

const runtime: TMBrowserRuntime = {
  Webcam: class {},
  async loadFromFiles() {
    return undefined;
  }
};

const projectBundle: PoseNetProjectBundle = {
  formatVersion: 1,
  encoding: 'base64',
  files: []
};

const bundledRuntime = createBundledTMRuntime({
  runtime,
  projectBundle,
  parallelModelInitialization: true
});
const loadController = new AbortController();
const loadOptions: TMRuntimeLoadOptions = {
  signal: loadController.signal,
  parallelModelInitialization: true
};
void bundledRuntime.loadFromFiles({}, {}, {}, loadOptions);
const version: string = poseNetBundleManifest.distribution.version;

void bundledRuntime;
void version;
