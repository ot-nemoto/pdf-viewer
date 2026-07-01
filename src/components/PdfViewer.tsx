import { useMemo } from "react";
import { Document, Page } from "react-pdf";

type Props = {
  file: File;
  pageNumber: number;
  scale: number;
  onLoad: (numPages: number) => void;
  onError: (error: Error) => void;
};

export function PdfViewer({ file, pageNumber, scale, onLoad, onError }: Props) {
  // file prop の参照が変わるたびに再読込されるため、File 自体を安定参照で渡す
  const memoFile = useMemo(() => file, [file]);

  return (
    <div className="viewer">
      <Document
        file={memoFile}
        onLoadSuccess={({ numPages }) => onLoad(numPages)}
        onLoadError={onError}
        loading={<div className="viewer__msg">読み込み中…</div>}
        error={<div className="viewer__msg">表示できませんでした</div>}
      >
        <Page pageNumber={pageNumber} scale={scale} renderTextLayer renderAnnotationLayer />
      </Document>
    </div>
  );
}
