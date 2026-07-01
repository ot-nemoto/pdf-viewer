type Props = {
  fileName: string;
  pageNumber: number;
  numPages: number;
  scale: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClose: () => void;
};

export function Toolbar({
  fileName,
  pageNumber,
  numPages,
  scale,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onClose,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__group toolbar__group--name" title={fileName}>
        {fileName}
      </div>

      <div className="toolbar__group">
        <button onClick={onPrev} disabled={pageNumber <= 1}>
          ‹
        </button>
        <span className="toolbar__page">
          {pageNumber} / {numPages || "–"}
        </span>
        <button onClick={onNext} disabled={pageNumber >= numPages}>
          ›
        </button>
      </div>

      <div className="toolbar__group">
        <button onClick={onZoomOut}>−</button>
        <button className="toolbar__scale" onClick={onResetZoom}>
          {Math.round(scale * 100)}%
        </button>
        <button onClick={onZoomIn}>＋</button>
      </div>

      <div className="toolbar__group">
        <button onClick={onClose}>✕ 閉じる</button>
      </div>
    </div>
  );
}
