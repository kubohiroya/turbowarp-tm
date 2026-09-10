import {TMExtension} from './extension.js';

if (!Scratch.extensions.unsandboxed) {
  // TurboWarp always sandboxes an extension loaded from an untrusted URL, and the
  // failed load leaves no message in the editor, so the recovery path belongs here.
  throw new Error(
    'TM must run without the extension sandbox. In TurboWarp\'s custom extension ' +
      'dialog, load the downloaded tm.js from the Files tab with "Run without ' +
      'sandbox" enabled; a URL pasted into the URL tab is always sandboxed.'
  );
}

const extension = new TMExtension();
Scratch.extensions.register(extension);
if (Scratch.vm?.runtime) {
  Scratch.vm.runtime.ext_kubohiroyatm = extension;
}
