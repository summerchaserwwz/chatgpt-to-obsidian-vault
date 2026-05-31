/// <reference types="vite/client" />

type FileSystemPermissionMode = "read" | "readwrite";

type FileSystemPermissionDescriptor = {
  mode?: FileSystemPermissionMode;
};

interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
  queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
}

interface Window {
  showDirectoryPicker?: (options?: { mode?: FileSystemPermissionMode; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write: (data: BlobPart) => Promise<void>;
  close: () => Promise<void>;
}
