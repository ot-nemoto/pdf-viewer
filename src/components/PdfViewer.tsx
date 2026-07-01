import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

type Props = {
  file: File;
  pageNumber: number;
  scale: number;
  fitWidth: boolean;
  onLoad: (numPages: number) => void;
  onError: (error: Error) => void;
};

export function PdfViewer({ file, pageNumber, scale, fitWidth, onLoad, onError }: Props) {
  // file prop の参照が変わるたびに再読込されるため、File 自体を安定参照で渡す
  const memoFile = useMemo(() => file, [file]);

  // フィット表示用にコンテナ幅を計測し、リサイズに追従する
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        <Page pageNumber={pageNumber} {...sizeProps} renderTextLayer renderAnnotationLayer />
      </Document>
    </div>
  );
}
