import * as tensorflow from '@tensorflow/tfjs';
import * as poseNet from '@tensorflow-models/posenet';
import * as speechCommands from '@tensorflow-models/speech-commands';
import * as teachableMachineImage from '@teachablemachine/image';
import * as teachableMachinePose from '@teachablemachine/pose';
import packageMetadata from '../package.json' with {type: 'json'};
import {createRuntimeModelFileLoader} from './runtime-model-loader.js';

type RuntimeGlobal = typeof globalThis & {
  tf?: typeof tensorflow;
  speechCommands?: typeof speechCommands;
  tmImage?: typeof teachableMachineImage;
  tmPose?: typeof teachableMachinePose;
  tmAudio?: unknown;
  [key: symbol]: unknown;
};

const runtimeGlobal = globalThis as RuntimeGlobal;
if (runtimeGlobal.tf !== undefined && runtimeGlobal.tf !== tensorflow) {
  throw new Error('TMPose browser runtime found a different global TensorFlow.js instance.');
}
if (runtimeGlobal.tmPose !== undefined && runtimeGlobal.tmPose !== teachableMachinePose) {
  throw new Error('TMPose browser runtime found a different global Teachable Machine Pose instance.');
}
if (runtimeGlobal.tmImage !== undefined && runtimeGlobal.tmImage !== teachableMachineImage) {
  throw new Error('TMPose browser runtime found a different global Teachable Machine Image instance.');
}
if (runtimeGlobal.speechCommands !== undefined && runtimeGlobal.speechCommands !== speechCommands) {
  throw new Error('TMPose browser runtime found a different global speech-commands instance.');
}

const loadFromFiles = createRuntimeModelFileLoader({
  ready: () => tensorflow.ready(),
  loadClassifier: (model, weights) =>
    tensorflow.loadLayersModel(tensorflow.io.browserFiles([model, weights])),
  async loadMetadata(metadata) {
    const value: unknown = await new Response(metadata).json();
    if (
      typeof value !== 'object' ||
      value === null ||
      !Array.isArray((value as {labels?: unknown}).labels)
    ) {
      throw new Error('Invalid Metadata provided');
    }
    return value;
  },
  loadPoseNet: () =>
    poseNet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 257,
      multiplier: 0.75
    }),
  createModel: (classifier, loadedPoseNet, metadata) =>
    new teachableMachinePose.CustomPoseNet(
      classifier as tensorflow.LayersModel,
      loadedPoseNet as poseNet.PoseNet,
      metadata as teachableMachinePose.Metadata
    )
});
const runtime = Object.freeze({...teachableMachinePose, loadFromFiles});
const audioRuntime = Object.freeze({
  async load(modelURL: string, metadataURL: string) {
    const recognizer = speechCommands.create(
      'BROWSER_FFT',
      undefined,
      modelURL,
      metadataURL
    );
    await recognizer.ensureModelLoaded();
    return recognizer;
  }
});

runtimeGlobal.tf = tensorflow;
runtimeGlobal.speechCommands = speechCommands;
runtimeGlobal.tmImage = teachableMachineImage;
runtimeGlobal.tmPose = runtime;
runtimeGlobal.tmAudio = audioRuntime;
const runtimeMetadata = Object.freeze({
  version: packageMetadata.version,
  tensorflow: '1.3.1',
  speechCommands: '0.4.0',
  teachableMachineImage: '0.8.5',
  teachableMachinePose: '0.8.3'
});
runtimeGlobal[Symbol.for('@kubohiroya/turbowarp-tm/runtime')] = runtimeMetadata;
runtimeGlobal[Symbol.for('@kubohiroya/turbowarp-teachablemachine/runtime')] = runtimeMetadata;
runtimeGlobal[Symbol.for('@kubohiroya/turbowarp-tmpose/runtime')] = runtimeMetadata;
