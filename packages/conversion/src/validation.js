import { INPUT_EXTENSIONS, MAX_FILE_SIZE_BYTES, OUTPUT_BY_KIND, PROFILE_PRESETS, } from "./config";
export function getFileExtension(fileName) {
    const parts = fileName.toLowerCase().split(".");
    return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}
export function detectMediaKind(fileName, mimeType) {
    const extension = getFileExtension(fileName);
    const loweredMime = mimeType.toLowerCase();
    if (loweredMime.startsWith("video/") || INPUT_EXTENSIONS.video.includes(extension)) {
        return "video";
    }
    if (loweredMime.startsWith("audio/") || INPUT_EXTENSIONS.audio.includes(extension)) {
        return "audio";
    }
    throw new Error("Unsupported file type.");
}
export function validateInputFile(file) {
    if (!file.name) {
        throw new Error("File must have a name.");
    }
    if (file.size <= 0) {
        throw new Error("File is empty.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("File exceeds maximum allowed size.");
    }
    return detectMediaKind(file.name, file.mimeType);
}
export function getAllowedOutputs(kind) {
    return OUTPUT_BY_KIND[kind];
}
export function validateSelection(kind, selection) {
    if (!OUTPUT_BY_KIND[kind].includes(selection.outputFormat)) {
        throw new Error("Selected output format is invalid for this file type.");
    }
}
export function getPresetById(id) {
    return PROFILE_PRESETS.find((preset) => preset.id === id);
}
