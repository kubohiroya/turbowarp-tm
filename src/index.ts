import {TMExtension} from './extension.js';

if (!Scratch.extensions.unsandboxed) {
  throw new Error('TM must run without the extension sandbox.');
}

const extension = new TMExtension();
Scratch.extensions.register(extension);
if (Scratch.vm?.runtime) {
  Scratch.vm.runtime.ext_kubohiroyatm = extension;
}
