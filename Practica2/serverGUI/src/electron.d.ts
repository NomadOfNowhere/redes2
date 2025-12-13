export {};

declare global {
  interface Window {
    electronAPI: {
      startServer: (filePath: string) => void;
      stopJava: () => void;
      onJavaLog: (callback: (msg: string) => void) => void;
      onJavaFinished: (callback: (code: number) => void) => void;
    };
  }
}