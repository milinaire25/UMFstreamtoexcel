'use strict';

// On POSIX, SIGINT gives Java the same shutdown-hook opportunity as Ctrl+C.
// Windows does not support graceful POSIX signals; report that exit as forced.
module.exports = function terminateProcess(proc, { graceMs = 15000, killMs = 3000, platform = process.platform } = {}) {
  if (proc.exitCode != null || proc.signalCode != null) return Promise.resolve({ forced: false });
  return new Promise((resolve, reject) => {
    let timer;
    let forced = platform === 'win32';
    function cleanup() {
      clearTimeout(timer);
      proc.removeListener('exit', onExit);
      proc.removeListener('error', onError);
    }
    function onExit() { cleanup(); resolve({ forced }); }
    function onError(error) { cleanup(); reject(error); }
    proc.once('exit', onExit);
    proc.once('error', onError);
    timer = setTimeout(() => {
      forced = true;
      timer = setTimeout(() => onError(new Error('Java did not exit after SIGKILL; session is still blocked.')), killMs);
      try { proc.kill('SIGKILL'); } catch (error) { onError(error); }
    }, graceMs);
    try { proc.kill('SIGINT'); } catch (error) { onError(error); }
  });
};
