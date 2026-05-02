declare module "expo-document-picker" {
  export type DocumentPickerAsset = {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  };

  export type DocumentPickerResult =
    | {
        canceled: true;
        assets: [];
      }
    | {
        canceled: false;
        assets: DocumentPickerAsset[];
      };

  export function getDocumentAsync(options?: {
    multiple?: boolean;
    type?: string[];
    copyToCacheDirectory?: boolean;
  }): Promise<DocumentPickerResult>;
}

declare module "expo-file-system" {
  export const cacheDirectory: string | null;
  export function downloadAsync(uri: string, fileUri: string): Promise<{
    uri: string;
    status: number;
    headers: Record<string, string>;
  }>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(uri: string): Promise<void>;
}

declare module "expo-sqlite" {
  type BindValue = string | number | null;

  export type SQLiteDatabase = {
    execSync(sql: string): void;
    runSync(sql: string, params?: BindValue[]): void;
    getAllSync<T>(sql: string, params?: BindValue[]): T[];
  };

  export function openDatabaseSync(name: string): SQLiteDatabase;
}

declare module "*.css";
