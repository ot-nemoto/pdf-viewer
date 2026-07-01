import { pdfjs } from "react-pdf";

// react-pdf の CSS（テキスト選択・注釈レイヤー）。省くと警告が出る
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js の worker を別スレッドで動かす。
// Vite では ?url ではなく new URL(...) 形式でバンドルさせるのが安定。
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
