let isConfigured = false;

export function configurePdfJsWorker(pdfjs: typeof import("pdfjs-dist")) {
  if (isConfigured) return;

  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdfjs-worker-entry.ts", import.meta.url).toString();
  isConfigured = true;
}
