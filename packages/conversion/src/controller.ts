import {
  CHUNK_SIZE_BYTES,
  MAX_CHUNK_RETRIES,
} from "./config";
import type {
  ApiErrorPayload,
  ConversionFile,
  ConversionState,
  ConversionSuccess,
  ProgressMessage,
  SelectedConversion,
} from "./types";
import { validateConversionPair, validateInputFile, validateSelection } from "./validation";

export type ControllerProgress = {
  uploadPercent: number;
  conversionPercent: number;
};

export type ControllerResult = {
  state: ConversionState;
  progress: ControllerProgress;
  success?: ConversionSuccess;
  error?: string;
};

type StartConversionInput = {
  file: ConversionFile;
  selection: SelectedConversion;
};

type StartConversionAdapters = {
  serverUrl: string;
  onStateChange: (next: ControllerResult) => void;
};

function createUploadId() {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
  return `up_${randomPart}`;
}

async function uploadChunkWithRetry(
  serverUrl: string,
  uploadId: string,
  file: ConversionFile,
  chunk: Blob,
  index: number,
  totalChunks: number,
): Promise<void> {
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
    } catch (error) {
      attempts += 1;
      if (attempts >= MAX_CHUNK_RETRIES) {
        throw error;
      }
    }
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

function subscribeProgress(
  serverUrl: string,
  jobId: string,
  onMessage: (message: ProgressMessage) => void,
): () => void {
  let active = true;

  const poll = async () => {
    while (active) {
      try {
        const response = await fetch(`${serverUrl}/progress/${jobId}?poll=1`);
        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const current = (await response.json()) as ProgressMessage;
        onMessage(current);

        if (current.status === "completed" || current.status === "error") {
          break;
        }
      } catch {
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

async function sliceChunk(sourceBlob: Blob, start: number, end: number): Promise<Blob> {
  const maybeSlicable = sourceBlob as unknown as {
    slice?: (start?: number, end?: number) => Blob;
  };

  if (typeof maybeSlicable.slice === "function") {
    return maybeSlicable.slice(start, end);
  }

  const allBytes = new Uint8Array(await sourceBlob.arrayBuffer());
  const chunkBytes = allBytes.slice(start, end);
  return new Blob([chunkBytes]);
}

export async function startConversion(
  input: StartConversionInput,
  adapters: StartConversionAdapters,
): Promise<ControllerResult> {
  const { file, selection } = input;
  const { onStateChange, serverUrl } = adapters;

  const kind = validateInputFile(file);
  validateSelection(kind, selection);
  validateConversionPair(file.name, selection.outputFormat);

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
    const chunk = await sliceChunk(file.blob, start, end);

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

  const completePayload = (await completeResponse.json()) as {
    jobId: string;
  };

  return await new Promise<ControllerResult>((resolve) => {
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
