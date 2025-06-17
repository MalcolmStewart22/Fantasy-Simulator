import ElectronFileSystem from './ElectronFileSystem';
import WebFileSystem from './WebFileSystem';

function isElectron() {
  return typeof window !== 'undefined' &&
    window.process &&
    window.process.type === 'renderer';
}

const FileSystem = isElectron() ? ElectronFileSystem : WebFileSystem;

export default FileSystem;