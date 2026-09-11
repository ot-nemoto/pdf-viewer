import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePdfFile } from "./usePdfFile";

function pdfFile(name = "sample.pdf") {
  return new File([new Uint8Array([1, 2, 3])], name, {
    type: "application/pdf",
  });
}

describe("usePdfFile", () => {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof usePdfFile>, void>>;

  beforeEach(() => {
    hook = renderHook(() => usePdfFile());
  });

  it("初期状態はファイル未読込・1ページ・等倍・非再生", () => {
    const s = hook.result.current;
    expect(s.file).toBeNull();
    expect(s.pageNumber).toBe(1);
    expect(s.scale).toBe(1.0);
    expect(s.isPlaying).toBe(false);
    expect(s.error).toBeNull();
  });

  it("PDF以外は拒否しエラーを設定する", () => {
    act(() => {
      hook.result.current.openFile(new File(["x"], "note.txt", { type: "text/plain" }));
    });
    expect(hook.result.current.file).toBeNull();
    expect(hook.result.current.error).toMatch(/PDF/);
  });

  it("PDFを開くとファイルがセットされ状態がリセットされる", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    expect(hook.result.current.fileName).toBe("sample.pdf");
    expect(hook.result.current.pageNumber).toBe(1);
    expect(hook.result.current.error).toBeNull();
  });

  it("ページ送りは 1..numPages にクランプされる", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    act(() => hook.result.current.onDocumentLoad(3));

    act(() => hook.result.current.goPrev()); // 1 未満に行かない
    expect(hook.result.current.pageNumber).toBe(1);

    act(() => hook.result.current.goNext());
    act(() => hook.result.current.goNext());
    expect(hook.result.current.pageNumber).toBe(3);

    act(() => hook.result.current.goNext()); // 最終ページを超えない
    expect(hook.result.current.pageNumber).toBe(3);
  });

  it("ズームは 0.5〜3.0 にクランプされる", () => {
    for (let i = 0; i < 20; i++) act(() => hook.result.current.zoomIn());
    expect(hook.result.current.scale).toBe(3.0);

    for (let i = 0; i < 40; i++) act(() => hook.result.current.zoomOut());
    expect(hook.result.current.scale).toBe(0.5);

    act(() => hook.result.current.resetZoom());
    expect(hook.result.current.scale).toBe(1.0);
  });

  it("fitMode は初期状態で width", () => {
    expect(hook.result.current.fitMode).toBe("width");
  });

  it("toggleFit で同一モードは解除、別モードは切替", () => {
    expect(hook.result.current.fitMode).toBe("width");

    // 同一モード再押下 → none
    act(() => hook.result.current.toggleFit("width"));
    expect(hook.result.current.fitMode).toBe("none");

    // 別モード → そのモードへ
    act(() => hook.result.current.toggleFit("height"));
    expect(hook.result.current.fitMode).toBe("height");

    // width へ切替
    act(() => hook.result.current.toggleFit("width"));
    expect(hook.result.current.fitMode).toBe("width");
  });

  it("手動ズームで fitMode が none になる", () => {
    act(() => hook.result.current.zoomIn());
    expect(hook.result.current.fitMode).toBe("none");

    act(() => hook.result.current.toggleFit("height"));
    expect(hook.result.current.fitMode).toBe("height");

    act(() => hook.result.current.zoomOut());
    expect(hook.result.current.fitMode).toBe("none");

    act(() => hook.result.current.toggleFit("width"));
    act(() => hook.result.current.resetZoom());
    expect(hook.result.current.fitMode).toBe("none");
  });

  it("フィットの実効倍率からのズームは 10% 刻みに丸められる", () => {
    // フィット中の実効倍率（半端な値）を同期
    act(() => hook.result.current.reportFitScale(1.12));
    act(() => hook.result.current.zoomOut());
    expect(hook.result.current.fitMode).toBe("none");
    // 1.12 - 0.2 = 0.92 → 0.9 に丸め
    expect(hook.result.current.scale).toBe(0.9);

    act(() => hook.result.current.reportFitScale(1.12));
    act(() => hook.result.current.zoomIn());
    // 1.12 + 0.2 = 1.32 → 1.3 に丸め
    expect(hook.result.current.scale).toBe(1.3);
  });

  it("openFile で fitMode が width にリセットされる", () => {
    act(() => hook.result.current.zoomIn());
    expect(hook.result.current.fitMode).toBe("none");

    act(() => hook.result.current.openFile(pdfFile()));
    expect(hook.result.current.fitMode).toBe("width");
  });

  it("自動送りトグルで再生状態が反転する", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    act(() => hook.result.current.onDocumentLoad(3));

    act(() => hook.result.current.togglePlay());
    expect(hook.result.current.isPlaying).toBe(true);

    act(() => hook.result.current.togglePlay());
    expect(hook.result.current.isPlaying).toBe(false);
  });

  it("最終ページで再生開始すると先頭に戻る", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    act(() => hook.result.current.onDocumentLoad(3));
    act(() => hook.result.current.goNext());
    act(() => hook.result.current.goNext());
    expect(hook.result.current.pageNumber).toBe(3);

    act(() => hook.result.current.togglePlay());
    expect(hook.result.current.isPlaying).toBe(true);
    expect(hook.result.current.pageNumber).toBe(1);
  });

  it("closeFile で初期状態に戻る", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    act(() => hook.result.current.onDocumentLoad(3));
    act(() => hook.result.current.closeFile());
    expect(hook.result.current.file).toBeNull();
    expect(hook.result.current.pageNumber).toBe(1);
    expect(hook.result.current.isPlaying).toBe(false);
  });

  it("openUrl は URL を表示対象にし、ファイル名をパス末尾から導出する", () => {
    act(() => hook.result.current.openUrl("https://example.com/dir/a.pdf?token=x"));
    expect(hook.result.current.file).toBe("https://example.com/dir/a.pdf?token=x");
    expect(hook.result.current.fileName).toBe("a.pdf");
    expect(hook.result.current.pageNumber).toBe(1);
    expect(hook.result.current.fitMode).toBe("width");
    expect(hook.result.current.error).toBeNull();
  });

  it("openUrl は拡張子で弾かない（拡張子なしの配信を許容する）", () => {
    act(() => hook.result.current.openUrl("https://arxiv.org/pdf/1706.03762"));
    expect(hook.result.current.file).toBe("https://arxiv.org/pdf/1706.03762");
    expect(hook.result.current.error).toBeNull();
  });

  it("URL 読み込みの失敗は Empty に戻し、別タブ導線用の URL を残す", () => {
    act(() => hook.result.current.openUrl("https://example.com/a.pdf"));
    act(() => hook.result.current.onLoadError(new Error("Failed to fetch")));

    expect(hook.result.current.file).toBeNull();
    expect(hook.result.current.fileName).toBe("");
    expect(hook.result.current.error).toMatch(/CORS/);
    expect(hook.result.current.errorUrl).toBe("https://example.com/a.pdf");
  });

  it("ローカルファイルの読み込み失敗はファイルを保持し errorUrl を持たない", () => {
    act(() => hook.result.current.openFile(pdfFile()));
    act(() => hook.result.current.onLoadError(new Error("broken")));

    expect(hook.result.current.file).not.toBeNull();
    expect(hook.result.current.error).toMatch(/broken/);
    expect(hook.result.current.errorUrl).toBeNull();
  });

  it("openFile / openUrl は直前のエラーを消す", () => {
    act(() => hook.result.current.openUrl("https://example.com/a.pdf"));
    act(() => hook.result.current.onLoadError(new Error("Failed to fetch")));
    expect(hook.result.current.errorUrl).not.toBeNull();

    act(() => hook.result.current.openFile(pdfFile()));
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.errorUrl).toBeNull();
  });

  it("reportError は読み込み前のエラーを表示する", () => {
    act(() => hook.result.current.reportError("URL パラメータを開けません"));
    expect(hook.result.current.error).toBe("URL パラメータを開けません");
    expect(hook.result.current.errorUrl).toBeNull();
    expect(hook.result.current.file).toBeNull();
  });

  it("onLoadProgress は進捗を 0〜1 に正規化する", () => {
    act(() => hook.result.current.onLoadProgress(50, 200));
    expect(hook.result.current.progress).toBe(0.25);

    // 総バイト数を超える通知は 1 にクランプする
    act(() => hook.result.current.onLoadProgress(300, 200));
    expect(hook.result.current.progress).toBe(1);

    // 総バイト数が不明な間は進捗を出さない
    act(() => hook.result.current.onLoadProgress(50, 0));
    expect(hook.result.current.progress).toBeNull();
  });

  it("読み込み完了・closeFile で進捗がクリアされる", () => {
    act(() => hook.result.current.openUrl("https://example.com/a.pdf"));
    act(() => hook.result.current.onLoadProgress(50, 200));
    act(() => hook.result.current.onDocumentLoad(3));
    expect(hook.result.current.progress).toBeNull();

    act(() => hook.result.current.onLoadProgress(50, 200));
    act(() => hook.result.current.closeFile());
    expect(hook.result.current.progress).toBeNull();
    expect(hook.result.current.fileName).toBe("");
  });
});
