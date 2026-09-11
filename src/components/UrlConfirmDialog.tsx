import { useEffect, useRef, useState } from "react";
import { fetchContentLength, fileNameFromUrl, formatBytes } from "../lib/pdfUrl";

type Props = {
  /** 検証済み（http / https）の URL */
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * `?pdf=` を無検証で自動読み込みしないための確認ダイアログ。
 * 第三者が作ったリンクで任意の PDF を本サイトの画面内に開かせないよう、
 * 取得元オリジンとダウンロード量を示したうえでユーザーの承認を取る。
 */
export function UrlConfirmDialog({ url, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const [sizeChecked, setSizeChecked] = useState(false);

  // StrictMode では effect が二度走る。開いたままの dialog への showModal() は
  // 例外になるため、cleanup で必ず閉じてから開き直す
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  // サイズは HEAD で取得する。取れない場合（HEAD 非対応・CORS 不許可）は「不明」として続行する
  useEffect(() => {
    let cancelled = false;
    fetchContentLength(url).then((bytes) => {
      if (cancelled) return;
      setSize(bytes);
      setSizeChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const { origin } = new URL(url);

  return (
    <dialog
      className="url-dialog"
      ref={dialogRef}
      aria-labelledby="url-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 className="url-dialog__title" id="url-dialog-title">
        外部の PDF を開きます
      </h2>

      <dl className="url-dialog__meta">
        <dt>取得元</dt>
        <dd className="url-dialog__origin">{origin}</dd>

        <dt>URL</dt>
        <dd className="url-dialog__url" title={url}>
          {url}
        </dd>

        <dt>ファイル</dt>
        <dd>{fileNameFromUrl(url)}</dd>

        <dt>サイズ</dt>
        <dd>{sizeChecked ? (size === null ? "不明" : formatBytes(size)) : "確認中…"}</dd>
      </dl>

      <p className="url-dialog__note">
        この PDF
        は取得元のサーバーから直接ダウンロードされます。信頼できる取得元か確認してください。
      </p>

      <div className="url-dialog__actions">
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
        <button type="button" className="url-dialog__primary" onClick={onConfirm}>
          開く
        </button>
      </div>
    </dialog>
  );
}
