export {};

declare global {
  interface Window {
    electronAPI: {
      startClient: () => void;
      stopJava: () => void;
      onJavaLog: (callback: (msg: string) => void) => void;
      onJavaFinished: (callback: (code: number) => void) => void;
      onSongReceived: (callback: (path: string) => void) => void;
    };
  }
}