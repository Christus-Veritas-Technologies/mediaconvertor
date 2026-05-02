export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_CHUNK_RETRIES = 3;
export const INPUT_EXTENSIONS = {
    video: ["mp4", "mov", "mkv", "avi", "webm"],
    audio: ["mp3", "wav", "aac", "ogg", "m4a", "flac"],
};
export const OUTPUT_BY_KIND = {
    video: ["mp4", "webm", "mov"],
    audio: ["mp3", "wav", "aac", "ogg", "m4a"],
};
export const PROFILE_PRESETS = [
    {
        id: "video-social",
        label: "Video Social",
        description: "MP4 tuned for social uploads",
        outputFormat: "mp4",
        quality: "medium",
    },
    {
        id: "video-master",
        label: "Video Master",
        description: "High quality MOV export",
        outputFormat: "mov",
        quality: "high",
    },
    {
        id: "audio-podcast",
        label: "Podcast Audio",
        description: "AAC tuned for spoken voice",
        outputFormat: "aac",
        quality: "medium",
    },
    {
        id: "audio-lossless",
        label: "Lossless Audio",
        description: "WAV archival output",
        outputFormat: "wav",
        quality: "high",
    },
];
