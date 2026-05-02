import type { ConversionFile, MediaKind, OutputFormat, SelectedConversion } from "./types";
export declare function getFileExtension(fileName: string): string;
export declare function detectMediaKind(fileName: string, mimeType: string): MediaKind;
export declare function validateInputFile(file: ConversionFile): MediaKind;
export declare function getAllowedOutputs(kind: MediaKind): readonly OutputFormat[];
export declare function validateSelection(kind: MediaKind, selection: SelectedConversion): void;
export declare function getPresetById(id: string): import("./types").ConversionProfile | undefined;
