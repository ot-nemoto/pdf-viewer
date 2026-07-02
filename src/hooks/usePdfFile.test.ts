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
    expect(hook.result.current.file?.name).toBe("sample.pdf");
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

  it("fitWidth は初期状態で true", () => {
    expect(hook.result.current.fitWidth).toBe(true);
  });

  it("toggleFitWidth で ON/OFF が反転する", () => {
    expect(hook.result.current.fitWidth).toBe(true);

    act(() => hook.result.current.toggleFitWidth());
    expect(hook.result.current.fitWidth).toBe(false);

    act(() => hook.result.current.toggleFitWidth());
    expect(hook.result.current.fitWidth).toBe(true);
  });

  it("手動ズームで fitWidth が解除される", () => {
    act(() => hook.result.current.zoomIn());
    expect(hook.result.current.fitWidth).toBe(false);

    act(() => hook.result.current.toggleFitWidth());
    expect(hook.result.current.fitWidth).toBe(true);

    act(() => hook.result.current.zoomOut());
    expect(hook.result.current.fitWidth).toBe(false);

    act(() => hook.result.current.toggleFitWidth());
    act(() => hook.result.current.resetZoom());
    expect(hook.result.current.fitWidth).toBe(false);
  });

  it("フィットの実効倍率からのズームは 10% 刻みに丸められる", () => {
    // フィット中の実効倍率（半端な値）を同期
    act(() => hook.result.current.reportFitScale(1.12));
    act(() => hook.result.current.zoomOut());
    expect(hook.result.current.fitWidth).toBe(false);
    // 1.12 - 0.2 = 0.92 → 0.9 に丸め
    expect(hook.result.current.scale).toBe(0.9);

    act(() => hook.result.current.reportFitScale(1.12));
    act(() => hook.result.current.zoomIn());
    // 1.12 + 0.2 = 1.32 → 1.3 に丸め
    expect(hook.result.current.scale).toBe(1.3);
  });

  it("openFile で fitWidth が true にリセットされる", () => {
    act(() => hook.result.current.zoomIn());
    expect(hook.result.current.fitWidth).toBe(false);

    act(() => hook.result.current.openFile(pdfFile()));
    expect(hook.result.current.fitWidth).toBe(true);
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
});
