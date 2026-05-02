import { CHUNK_SIZE_BYTES, MAX_CHUNK_RETRIES, } from "./config";
import { validateInputFile, validateSelection } from "./validation";
function createUploadId() {
    const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
    return `up_${randomPart}`;
}
async function uploadChunkWithRetry(serverUrl, uploadId, file, chunk, index, totalChunks) {
    let attempts = 0;
    while (attempts < MAX_CHUNK_RETRIES) {
        try {
            const formData = new FormData();
            formData.append("uploadId", uploadId);
            formData.append("index", String(index));
            formData.append("totalChunks", String(totalChunks));
            formData.append("filename", file.name);
            formData.append("mimeType", file.mimeType);
            formData.append("chunk", chunk, `${file.name}.part${index}`);
            const response = await fetch(`${serverUrl}/upload/chunk`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response));
            }
            return;
        }
        catch (error) {
            attempts += 1;
            if (attempts >= MAX_CHUNK_RETRIES) {
                throw error;
            }
        }
    }
}
async function readErrorMessage(response) {
    try {
        const payload = (await response.json());
        return payload.error || `Request failed with ${response.status}`;
    }
    catch {
        return `Request failed with ${response.status}`;
    }
}
function subscribeProgress(serverUrl, jobId, onMessage) {
    if (typeof EventSource === "undefined") {
        let active = true;
        const poll = async () => {
            while (active) {
                try {
                    const response = await fetch(`${serverUrl}/progress/${jobId}?poll=1`);
                    if (!response.ok) {
                        throw new Error(await readErrorMessage(response));
                    }
                    const current = (await response.json());
                    onMessage(current);
                    if (current.status === "completed" || current.status === "error") {
                        break;
                    }
                }
                catch {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 450));
            }
        };
        void poll();
        return () => {
            active = false;
        };
    }
    const eventSource = new EventSource(`${serverUrl}/progress/${jobId}`);
    eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        onMessage(payload);
    };
    eventSource.onerror = () => {
        eventSource.close();
    };
    return () => eventSource.close();
}
export async function startConversion(input, adapters) {
    const { file, selection } = input;
    const { onStateChange, serverUrl } = adapters;
    const kind = validateInputFile(file);
    validateSelection(kind, selection);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);
    const uploadId = createUploadId();
    onStateChange({
        state: "uploading",
        progress: {
            uploadPercent: 0,
            conversionPercent: 0,
        },
    });
    for (let index = 0; index < totalChunks; index += 1) {
        const start = index * CHUNK_SIZE_BYTES;
        const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
        const chunk = file.blob.slice(start, end);
        await uploadChunkWithRetry(serverUrl, uploadId, file, chunk, index, totalChunks);
        const uploadPercent = Math.round(((index + 1) / totalChunks) * 100);
        onStateChange({
            state: "uploading",
            progress: {
                uploadPercent,
                conversionPercent: 0,
            },
        });
    }
    const completeResponse = await fetch(`${serverUrl}/upload/complete`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            uploadId,
            outputFormat: selection.outputFormat,
            quality: selection.quality,
        }),
    });
    if (!completeResponse.ok) {
        throw new Error(await readErrorMessage(completeResponse));
    }
    const completePayload = (await completeResponse.json());
    return await new Promise((resolve) => {
        onStateChange({
            state: "processing",
            progress: {
                uploadPercent: 100,
                conversionPercent: 0,
            },
        });
        const unsubscribe = subscribeProgress(serverUrl, completePayload.jobId, (message) => {
            if (message.status === "error") {
                unsubscribe();
                resolve({
                    state: "error",
                    progress: {
                        uploadPercent: 100,
                        conversionPercent: message.percent,
                    },
                    error: message.error || "Conversion failed.",
                });
                return;
            }
            if (message.status === "completed") {
                unsubscribe();
                resolve({
                    state: "completed",
                    progress: {
                        uploadPercent: 100,
                        conversionPercent: 100,
                    },
                    success: {
                        jobId: message.jobId,
                        outputFileName: `converted.${selection.outputFormat}`,
                        outputFormat: selection.outputFormat,
                        sizeBytes: 0,
                        completedAt: new Date().toISOString(),
                    },
                });
                return;
            }
            onStateChange({
                state: "processing",
                progress: {
                    uploadPercent: 100,
                    conversionPercent: message.percent,
                },
            });
        });
    });
}
