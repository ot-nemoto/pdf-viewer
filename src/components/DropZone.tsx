import { useCallback, useRef, useState, type DragEvent } from "react";

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
    <div
      className={`dropzone${dragging ? " dropzone--active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {empty ? (
        <div className="dropzone__hint" onClick={() => inputRef.current?.click()}>
          <p className="dropzone__title">PDF をここにドラッグ＆ドロップ</p>
          <p className="dropzone__sub">またはクリックしてファイルを選択</p>
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
