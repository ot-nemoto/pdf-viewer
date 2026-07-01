import { type DragEvent, useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  /** ファイル未読込のとき true。中央に大きなドロップ案内を出す */
  empty: boolean;
  children?: React.ReactNode;
};

export function DropZone({ onFile, empty, children }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ファイルのドロップ先となる領域で、代替となる semantic 要素がない
    <div
      className={`dropzone${dragging ? " dropzone--active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {empty ? (
        <div className="dropzone__hint">
          <button
            type="button"
            className="dropzone__hint-btn"
            onClick={() => inputRef.current?.click()}
          >
            <span className="dropzone__title">PDF をここにドラッグ＆ドロップ</span>
            <span className="dropzone__sub">またはクリックしてファイルを選択</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
