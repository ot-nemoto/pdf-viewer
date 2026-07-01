import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

type Props = {
  file: File;
  pageNumber: number;
  scale: number;
  fitWidth: boolean;
  onLoad: (numPages: number) => void;
  onError: (error: Error) => void;
  /** フィット中の実効倍率（コンテナ幅 / ページ本来の幅）を通知する */
  onFitScale: (scale: number) => void;
};

export function PdfViewer({
  file,
  pageNumber,
  scale,
  fitWidth,
  onLoad,
  onError,
  onFitScale,
}: Props) {
  // file prop の参照が変わるたびに再読込されるため、File 自体を安定参照で渡す
  const memoFile = useMemo(() => file, [file]);

  // フィット表示用にコンテナ幅を計測し、リサイズに追従する
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  // ページ本来の幅（scale=1 相当）。実効倍率の算出に使う
  const [nativeWidth, setNativeWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 初回から幅フィットで描画できるよう、監視前に一度同期計測する
    setContainerWidth(el.clientWidth);
    // ResizeObserver 未対応環境では初期計測のみで監視はスキップ
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // フィット中は実効倍率を scale に同期し、フィット解除後の ±ズームの基準を揃える
  useEffect(() => {
    if (fitWidth && containerWidth > 0 && nativeWidth > 0) {
      onFitScale(containerWidth / nativeWidth);
    }
  }, [fitWidth, containerWidth, nativeWidth, onFitScale]);

  // フィット時は width（コンテナ幅）を、非フィット時は scale を渡す
  const sizeProps = fitWidth && containerWidth > 0 ? { width: containerWidth } : { scale };

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
          onLoadSuccess={(page) => setNativeWidth(page.originalWidth)}
          renderTextLayer
          renderAnnotationLayer
        />
      </Document>
    </div>
  );
}
