import type { PermissionResult, WriteResult } from "../shared/types";

export class FileSystemAccessWriter {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  canWriteDirectly(): boolean {
    return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
  }

  async chooseDirectory(): Promise<PermissionResult> {
    if (!this.canWriteDirectly() || !window.showDirectoryPicker) {
      return { ok: false, reason: "File System Access API is unavailable." };
    }

    this.directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    return this.ensurePermission();
  }

  async ensurePermission(): Promise<PermissionResult> {
    if (!this.directoryHandle) {
      return { ok: false, reason: "No Vault directory selected." };
    }

    const descriptor = { mode: "readwrite" as const };
    const current = await this.directoryHandle.queryPermission?.(descriptor);
    if (current === "granted") {
      return { ok: true, reason: "Vault write permission is active." };
    }

    const requested = await this.directoryHandle.requestPermission?.(descriptor);
    return requested === "granted"
      ? { ok: true, reason: "Vault write permission granted." }
      : { ok: false, reason: "Vault write permission denied." };
  }

  async writeMarkdown(path: string, markdown: string): Promise<WriteResult> {
    const permission = await this.ensurePermission();
    if (!permission.ok || !this.directoryHandle) {
      return { ok: false, path, status: "failed", reason: permission.reason };
    }

    const parts = path.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) {
      return { ok: false, path, status: "failed", reason: "Target filename is empty." };
    }

    let directory = this.directoryHandle;
    for (const part of parts) {
      directory = await directory.getDirectoryHandle(part, { create: true });
    }

    const file = await directory.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();
    await writable.write(markdown);
    await writable.close();

    return { ok: true, path, status: "updated", reason: "File written to Vault." };
  }
}
