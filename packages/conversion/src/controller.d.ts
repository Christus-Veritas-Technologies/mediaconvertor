import type { ConversionFile, ConversionState, ConversionSuccess, SelectedConversion } from "./types";
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
export declare function startConversion(input: StartConversionInput, adapters: StartConversionAdapters): Promise<ControllerResult>;
export {};
