export interface IMetadataRepository {
  getInt(key: string, defaultValue?: number): Promise<number>;
  incrementInt(key: string): Promise<number>;
  setInt(key: string, value: number): Promise<void>;
  getText(key: string, defaultValue?: string): Promise<string | null>;
  setText(key: string, value: string): Promise<void>;
}

