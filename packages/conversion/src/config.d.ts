import type { ConversionProfile, MediaKind, OutputFormat } from "./types";
export declare const MAX_FILE_SIZE_BYTES: number;
export declare const CHUNK_SIZE_BYTES: number;
export declare const MAX_CHUNK_RETRIES = 3;
export declare const INPUT_EXTENSIONS: Record<MediaKind, readonly string[]>;
export declare const OUTPUT_BY_KIND: Record<MediaKind, readonly OutputFormat[]>;
export declare const PROFILE_PRESETS: readonly ConversionProfile[];
