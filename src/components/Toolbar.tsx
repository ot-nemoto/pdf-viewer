import type { FitMode } from "../hooks/usePdfFile";

const INTERVAL_OPTIONS = [1, 2, 3, 5, 10];

type Props = {
  fileName: string;
  pageNumber: number;
  numPages: number;
  scale: number;
  fitMode: FitMode;
  isPlaying: boolean;
  intervalSec: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onTogglePlay: () => void;
  onChangeInterval: (sec: number) => void;
  onClose: () => void;
};

export function Toolbar({
  fileName,
  pageNumber,
  numPages,
  scale,
  fitMode,
  isPlaying,
  intervalSec,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onFitHeight,
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
          className={fitMode === "width" ? "toolbar__toggle--active" : ""}
          aria-pressed={fitMode === "width"}
          onClick={onFitWidth}
          title="幅に合わせる"
        >
          ⤢ 幅に合わせる
        </button>
        <button
          type="button"
          className={fitMode === "height" ? "toolbar__toggle--active" : ""}
          aria-pressed={fitMode === "height"}
          onClick={onFitHeight}
          title="高さに合わせる"
        >
          ⤡ 高さに合わせる
        </button>
        <button type="button" onClick={onZoomOut}>
          −
        </button>
        <button type="button" className="toolbar__scale" onClick={onResetZoom}>
          {fitMode === "none" ? `${Math.round(scale * 100)}%` : "自動"}
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
