import { useEffect, useRef } from "react";
import { fileNameFromUrl } from "../lib/pdfUrl";

type Props = {
  /** 検証済み（http / https）の URL */
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * `?pdf=` を無検証で自動読み込みしないための確認ダイアログ。
 * 第三者が作ったリンクで任意の PDF を本サイトの画面内に開かせないよう、
 * 取得元オリジンを示したうえでユーザーの承認を取る。
 *
 * 承認前は取得元へ一切通信しない。サイズ確認のための HEAD であっても、
 * リンクを開いただけで IP・UA が取得元に渡り（CORS はリクエスト送信自体を
 * 止めない）、キャンセルしても記録が残るため。ダウンロード量は承認後の
 * 進捗表示で伝える。
 */
export function UrlConfirmDialog({ url, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // StrictMode では effect が二度走る。開いたままの dialog への showModal() は
  // 例外になるため、cleanup で必ず閉じてから開き直す
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

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
