export interface AssetStore {
  write(name: string, content: Blob | ArrayBuffer | string): Promise<void>;
}
