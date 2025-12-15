export {};

declare global {
  interface Window {
    electronAPI: {
      startClient: (name: string) => void;
      stopJava: () => void;
      sendToJava: (msg: string) => void;
      onJavaLog: (callback: (msg: string) => void) => void;
      onJavaFinished: (callback: (code: number) => void) => void;
    };
  }
}