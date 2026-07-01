const INTERVAL_OPTIONS = [1, 2, 3, 5, 10];

type Props = {
  fileName: string;
  pageNumber: number;
  numPages: number;
  scale: number;
  fitWidth: boolean;
  isPlaying: boolean;
  intervalSec: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  onTogglePlay: () => void;
  onChangeInterval: (sec: number) => void;
  onClose: () => void;
};

export function Toolbar({
  fileName,
  pageNumber,
  numPages,
  scale,
  fitWidth,
  isPlaying,
  intervalSec,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onTogglePlay,
  onChangeInterval,
  onClose,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__group toolbar__group--name" title={fileName}>
        {fileName}
      </div>

      <div className="toolbar__group">
        <button type="button" onClick={onPrev} disabled={pageNumber <= 1}>
          ‹
        </button>
        <span className="toolbar__page">
          {pageNumber} / {numPages || "–"}
        </span>
        <button type="button" onClick={onNext} disabled={pageNumber >= numPages}>
          ›
        </button>
      </div>

      <div className="toolbar__group">
        <button
          type="button"
          className={fitWidth ? "toolbar__toggle--active" : ""}
          aria-pressed={fitWidth}
          onClick={onFitWidth}
          title="幅に合わせる"
        >
          ⤢ 幅に合わせる
        </button>
        <button type="button" onClick={onZoomOut}>
          −
        </button>
        <button type="button" className="toolbar__scale" onClick={onResetZoom}>
          {fitWidth ? "自動" : `${Math.round(scale * 100)}%`}
        </button>
        <button type="button" onClick={onZoomIn}>
          ＋
        </button>
      </div>

      <div className="toolbar__group">
        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? "自動送りを停止" : "自動送りを開始"}
        >
          {isPlaying ? "⏸ 停止" : "▶ 自動送り"}
        </button>
        <select
          value={intervalSec}
          onChange={(e) => onChangeInterval(Number(e.target.value))}
          title="ページ送り間隔"
        >
          {INTERVAL_OPTIONS.map((sec) => (
            <option key={sec} value={sec}>
              {sec}秒
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar__group">
        <button type="button" onClick={onClose}>
          ✕ 閉じる
        </button>
      </div>
    </div>
  );
}
