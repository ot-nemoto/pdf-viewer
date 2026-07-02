import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import type { FitMode } from "../hooks/usePdfFile";

type Props = {
  file: File;
  pageNumber: number;
  scale: number;
  fitMode: FitMode;
  onLoad: (numPages: number) => void;
  onError: (error: Error) => void;
  /** フィット中の実効倍率を通知する（幅: w/originalWidth、高さ: h/originalHeight） */
  onFitScale: (scale: number) => void;
};

export function PdfViewer({
  file,
  pageNumber,
  scale,
  fitMode,
  onLoad,
  onError,
  onFitScale,
}: Props) {
  // file prop の参照が変わるたびに再読込されるため、File 自体を安定参照で渡す
  const memoFile = useMemo(() => file, [file]);

  // フィット表示用にコンテナのサイズを計測し、リサイズに追従する
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  // ページ本来のサイズ（scale=1 相当）。実効倍率の算出に使う
  const [nativeWidth, setNativeWidth] = useState(0);
  const [nativeHeight, setNativeHeight] = useState(0);

  // ファイル切替時は native サイズをリセットし、新ページ読込前に
  // 古いページ比で onFitScale が走るのを防ぐ（effect の > 0 ガードで抑止）。
  // memoFile は「ファイル変更時に走らせる」ための意図的な依存。
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on file change
  useEffect(() => {
    setNativeWidth(0);
    setNativeHeight(0);
  }, [memoFile]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 初回からフィットで描画できるよう、監視前に一度同期計測する
    setContainerWidth(el.clientWidth);
    setContainerHeight(el.clientHeight);
    // ResizeObserver 未対応環境では初期計測のみで監視はスキップ
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
      setContainerHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // フィット中は実効倍率を scale に同期し、フィット解除後の ±ズームの基準を揃える
  useEffect(() => {
    if (fitMode === "width" && containerWidth > 0 && nativeWidth > 0) {
      onFitScale(containerWidth / nativeWidth);
    } else if (fitMode === "height" && containerHeight > 0 && nativeHeight > 0) {
      onFitScale(containerHeight / nativeHeight);
    }
  }, [fitMode, containerWidth, containerHeight, nativeWidth, nativeHeight, onFitScale]);

  // フィットモードに応じて width / height / scale を出し分ける
  let sizeProps: { width: number } | { height: number } | { scale: number };
  if (fitMode === "width" && containerWidth > 0) {
    sizeProps = { width: containerWidth };
  } else if (fitMode === "height" && containerHeight > 0) {
    sizeProps = { height: containerHeight };
  } else {
    sizeProps = { scale };
  }

  return (
    <div className="viewer" ref={containerRef}>
      <Document
        file={memoFile}
        onLoadSuccess={({ numPages }) => onLoad(numPages)}
        onLoadError={onError}
        loading={<div className="viewer__msg">読み込み中…</div>}
        error={<div className="viewer__msg">表示できませんでした</div>}
      >
        <Page
          pageNumber={pageNumber}
          {...sizeProps}
          onLoadSuccess={(page) => {
            setNativeWidth(page.originalWidth);
            setNativeHeight(page.originalHeight);
          }}
          renderTextLayer
          renderAnnotationLayer
        />
      </Document>
    </div>
  );
}
