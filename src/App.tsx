import "./pdfWorker";
import { useEffect, useState } from "react";
import { DropZone } from "./components/DropZone";
import { PdfViewer } from "./components/PdfViewer";
import { Toolbar } from "./components/Toolbar";
import { UrlConfirmDialog } from "./components/UrlConfirmDialog";
import { usePdfFile } from "./hooks/usePdfFile";
import { parsePdfUrlParam } from "./lib/pdfUrl";

export default function App() {
  const pdf = usePdfFile();
  const { file, isPlaying, pageNumber, numPages, intervalSec, goPrev, goNext, stopPlay } = pdf;
  const { openUrl, reportError } = pdf;

  // 承認待ちの URL。?pdf= を無検証で読み込まないため、確認ダイアログを挟む
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // 起動時に一度だけ ?pdf= を解釈する（reportError は安定参照のため再実行されない）
  useEffect(() => {
    const param = parsePdfUrlParam(window.location.search, window.location.protocol);
    if (param.status === "ok") {
      setPendingUrl(param.url);
    } else if (param.status === "invalid") {
      reportError(`URL パラメータを開けません: ${param.reason}`);
    }
  }, [reportError]);

  // ファイルを開いている間だけ ← / → でページ遷移
  useEffect(() => {
    if (!file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // フォーム要素にフォーカスがあるときは無視（矢印キーを奪わない）
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, goPrev, goNext]);

  // 自動ページ送り: 再生中は intervalSec ごとに次ページへ。最終ページで停止
  useEffect(() => {
    if (!file || !isPlaying) return;
    if (numPages && pageNumber >= numPages) {
      stopPlay();
      return;
    }
    const id = setTimeout(() => goNext(), intervalSec * 1000);
    return () => clearTimeout(id);
  }, [file, isPlaying, pageNumber, numPages, intervalSec, goNext, stopPlay]);

  return (
    <div className="app">
      {pdf.file && (
        <Toolbar
          fileName={pdf.fileName}
          pageNumber={pdf.pageNumber}
          numPages={pdf.numPages}
          scale={pdf.scale}
          onPrev={pdf.goPrev}
          onNext={pdf.goNext}
          onZoomIn={pdf.zoomIn}
          onZoomOut={pdf.zoomOut}
          onResetZoom={pdf.resetZoom}
          fitMode={pdf.fitMode}
          onFitWidth={() => pdf.toggleFit("width")}
          onFitHeight={() => pdf.toggleFit("height")}
          isPlaying={pdf.isPlaying}
          intervalSec={pdf.intervalSec}
          onTogglePlay={pdf.togglePlay}
          onChangeInterval={pdf.setIntervalSec}
          onClose={pdf.closeFile}
        />
      )}

      {pdf.error && (
        <div className="app__error">
          <span>{pdf.error}</span>
          {pdf.errorUrl && (
            <span className="app__error-hint">
              <a
                className="app__error-link"
                href={pdf.errorUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                新しいタブで開く
              </a>
              でダウンロードし、この画面にドラッグ＆ドロップすると表示できます。
            </span>
          )}
        </div>
      )}

      <DropZone onFile={pdf.openFile} empty={!pdf.file}>
        {pdf.file && (
          <PdfViewer
            file={pdf.file}
            pageNumber={pdf.pageNumber}
            scale={pdf.scale}
            fitMode={pdf.fitMode}
            progress={pdf.progress}
            onLoad={pdf.onDocumentLoad}
            onProgress={pdf.onLoadProgress}
            onError={pdf.onLoadError}
            onFitScale={pdf.reportFitScale}
          />
        )}
      </DropZone>

      {pendingUrl && (
        <UrlConfirmDialog
          url={pendingUrl}
          onConfirm={() => {
            openUrl(pendingUrl);
            setPendingUrl(null);
          }}
          onCancel={() => setPendingUrl(null)}
        />
      )}
    </div>
  );
}
