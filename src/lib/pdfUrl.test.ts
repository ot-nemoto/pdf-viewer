import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchContentLength, fileNameFromUrl, formatBytes, parsePdfUrlParam } from "./pdfUrl";

describe("parsePdfUrlParam", () => {
  it("http / https の URL を受け付ける", () => {
    expect(parsePdfUrlParam("?pdf=https://example.com/a.pdf")).toEqual({
      status: "ok",
      url: "https://example.com/a.pdf",
    });
    expect(parsePdfUrlParam("?pdf=http://example.com/a.pdf")).toEqual({
      status: "ok",
      url: "http://example.com/a.pdf",
    });
  });

  it("エンコードされた URL・クエリ付きの URL を復元する", () => {
    const target = "https://example.com/dir/a.pdf?token=abc&v=1";
    expect(parsePdfUrlParam(`?pdf=${encodeURIComponent(target)}`)).toEqual({
      status: "ok",
      url: target,
    });
  });

  it("先頭の ? の有無によらず解析できる", () => {
    expect(parsePdfUrlParam("pdf=https://example.com/a.pdf")).toEqual({
      status: "ok",
      url: "https://example.com/a.pdf",
    });
  });

  it("パラメータ未指定・空文字・空白のみは none", () => {
    expect(parsePdfUrlParam("")).toEqual({ status: "none" });
    expect(parsePdfUrlParam("?other=1")).toEqual({ status: "none" });
    // Vite が予約する ?url は使わないため、url パラメータは無視する
    expect(parsePdfUrlParam("?url=https://example.com/a.pdf")).toEqual({ status: "none" });
    expect(parsePdfUrlParam("?pdf=")).toEqual({ status: "none" });
    expect(parsePdfUrlParam("?pdf=%20%20")).toEqual({ status: "none" });
  });

  it("http / https 以外のスキームを拒否する", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:application/pdf;base64,AAAA",
      "file:///C:/a.pdf",
      "blob:https://example.com/1234",
    ]) {
      const result = parsePdfUrlParam(`?pdf=${encodeURIComponent(url)}`);
      expect(result.status).toBe("invalid");
    }
  });

  it("URL として解釈できない値を拒否する", () => {
    expect(parsePdfUrlParam("?pdf=not-a-url").status).toBe("invalid");
    // 相対パスは絶対 URL ではないため受け付けない
    expect(parsePdfUrlParam("?pdf=%2Fdocs%2Fa.pdf").status).toBe("invalid");
  });
});

describe("fileNameFromUrl", () => {
  it("パス末尾をファイル名として返す", () => {
    expect(fileNameFromUrl("https://example.com/dir/a.pdf")).toBe("a.pdf");
  });

  it("クエリ・フラグメントを除いた名前を返す", () => {
    expect(fileNameFromUrl("https://example.com/a.pdf?token=x#page=2")).toBe("a.pdf");
  });

  it("パーセントエンコードされた名前を復元する", () => {
    expect(fileNameFromUrl("https://example.com/%E8%B3%87%E6%96%99.pdf")).toBe("資料.pdf");
  });

  it("拡張子がなくてもそのまま採用する", () => {
    expect(fileNameFromUrl("https://arxiv.org/pdf/1706.03762")).toBe("1706.03762");
  });

  it("末尾にファイル名がない場合はフォールバックする", () => {
    expect(fileNameFromUrl("https://example.com/")).toBe("document.pdf");
    expect(fileNameFromUrl("https://example.com/dir/")).toBe("document.pdf");
  });

  it("不正なパーセントエンコードはデコードせず返す", () => {
    expect(fileNameFromUrl("https://example.com/%E3%81.pdf")).toBe("%E3%81.pdf");
  });

  it("URL として解釈できない場合はフォールバックする", () => {
    expect(fileNameFromUrl("not-a-url")).toBe("document.pdf");
  });
});

describe("formatBytes", () => {
  it("単位ごとに丸めて表記する", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(59687975)).toBe("56.9 MB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
    expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
    // 最大単位を超えても TB のまま繰り上げない
    expect(formatBytes(1024 ** 5)).toBe("1024.0 TB");
  });

  it("不正な値は空文字を返す", () => {
    expect(formatBytes(Number.NaN)).toBe("");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("");
    expect(formatBytes(-1)).toBe("");
  });
});

describe("fetchContentLength", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function response(init: { ok: boolean; contentLength?: string }) {
    return {
      ok: init.ok,
      headers: { get: () => init.contentLength ?? null },
    } as unknown as Response;
  }

  it("Content-Length を数値で返す", async () => {
    fetchMock.mockResolvedValue(response({ ok: true, contentLength: "59687975" }));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBe(59687975);
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/a.pdf", { method: "HEAD" });
  });

  it("Content-Length がない場合は null", async () => {
    fetchMock.mockResolvedValue(response({ ok: true }));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBeNull();
  });

  it("0 や不正な値は null", async () => {
    fetchMock.mockResolvedValue(response({ ok: true, contentLength: "0" }));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBeNull();

    fetchMock.mockResolvedValue(response({ ok: true, contentLength: "unknown" }));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBeNull();
  });

  it("エラーレスポンスは null", async () => {
    fetchMock.mockResolvedValue(response({ ok: false, contentLength: "100" }));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBeNull();
  });

  it("通信失敗（CORS 不許可・HEAD 非対応など）は null", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchContentLength("https://example.com/a.pdf")).resolves.toBeNull();
  });
});
