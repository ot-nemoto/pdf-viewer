import { describe, expect, it } from "vitest";
import { fileNameFromUrl, formatBytes, parsePdfUrlParam } from "./pdfUrl";

describe("parsePdfUrlParam", () => {
  // 既定は本番と同じ https 配信のページから呼ばれた想定
  const parse = (search: string, pageProtocol = "https:") => parsePdfUrlParam(search, pageProtocol);
  // autoplay / interval 未指定時の ok
  const DEFAULTS = { status: "ok", autoplay: false, intervalSec: 3 };
  const PDF = `pdf=${encodeURIComponent("https://example.com/a.pdf")}`;

  it("https の URL を受け付ける", () => {
    expect(parse("?pdf=https://example.com/a.pdf")).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
    });
  });

  it("http のページからは http の URL も受け付ける（ローカル開発）", () => {
    expect(parse("?pdf=http://example.com/a.pdf", "http:")).toEqual({
      ...DEFAULTS,
      url: "http://example.com/a.pdf",
    });
  });

  it("https のページからの http URL は混在コンテンツとして拒否する", () => {
    const result = parse("?pdf=http://example.com/a.pdf");
    expect(result.status).toBe("invalid");
    expect(result).toHaveProperty("reason", expect.stringContaining("混在コンテンツ"));
  });

  it("エンコードされた URL・クエリ付きの URL を復元する", () => {
    const target = "https://example.com/dir/a.pdf?token=abc&v=1";
    expect(parse(`?pdf=${encodeURIComponent(target)}`)).toEqual({
      ...DEFAULTS,
      url: target,
    });
  });

  it("先頭の ? の有無によらず解析できる", () => {
    expect(parse("pdf=https://example.com/a.pdf")).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
    });
  });

  it("パラメータ未指定・空文字・空白のみは none", () => {
    expect(parse("")).toEqual({ status: "none" });
    expect(parse("?other=1")).toEqual({ status: "none" });
    // Vite が予約する ?url は使わないため、url パラメータは無視する
    expect(parse("?url=https://example.com/a.pdf")).toEqual({ status: "none" });
    expect(parse("?pdf=")).toEqual({ status: "none" });
    expect(parse("?pdf=%20%20")).toEqual({ status: "none" });
  });

  it("http / https 以外のスキームを拒否する", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:application/pdf;base64,AAAA",
      "file:///C:/a.pdf",
      "blob:https://example.com/1234",
    ]) {
      const result = parse(`?pdf=${encodeURIComponent(url)}`);
      expect(result.status).toBe("invalid");
    }
  });

  it("未エンコードでクエリ付き URL を渡した場合は拒否する", () => {
    // URLSearchParams は `&` で値を切るため、v=1 が失われたまま開いてしまう
    const result = parse("?pdf=https://example.com/a.pdf?token=abc&v=1");
    expect(result.status).toBe("invalid");
    expect(result).toHaveProperty("reason", expect.stringContaining("encodeURIComponent"));
  });

  it("未エンコードの + を含む URL を拒否する", () => {
    // URLSearchParams は `+` を空白に変換するため、署名付き URL が壊れる
    const result = parse("?pdf=https://example.com/a+b.pdf");
    expect(result.status).toBe("invalid");
    expect(result).toHaveProperty("reason", expect.stringContaining("encodeURIComponent"));
  });

  it("エンコードされていれば + を含む URL も開ける", () => {
    const target = "https://example.com/sig%2Bvalue.pdf";
    expect(parse(`?pdf=${encodeURIComponent(target)}`)).toEqual({ ...DEFAULTS, url: target });
  });

  it("autoplay / interval を解釈する", () => {
    expect(parse(`?${PDF}&autoplay=1&interval=5`)).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
      autoplay: true,
      intervalSec: 5,
    });
    // 片方のみの指定。省略した側は既定値
    expect(parse(`?${PDF}&autoplay=1`)).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
      autoplay: true,
    });
    expect(parse(`?${PDF}&interval=10`)).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
      intervalSec: 10,
    });
    expect(parse(`?${PDF}&autoplay=0`)).toEqual({ ...DEFAULTS, url: "https://example.com/a.pdf" });
    expect(parse(`?${PDF}&autoplay=0&interval=5`)).toEqual({
      ...DEFAULTS,
      url: "https://example.com/a.pdf",
      intervalSec: 5,
    });
  });

  it("autoplay の不正値を拒否する", () => {
    for (const value of ["", "true", "yes", "2"]) {
      const result = parse(`?${PDF}&autoplay=${value}`);
      expect(result.status).toBe("invalid");
      expect(result).toHaveProperty("reason", expect.stringContaining("autoplay"));
    }
  });

  it("interval の選択肢以外の値を拒否する", () => {
    for (const value of ["", "0", "4", "5.0", "05", "%205", "abc", "-1"]) {
      const result = parse(`?${PDF}&interval=${value}`);
      expect(result.status).toBe("invalid");
      expect(result).toHaveProperty("reason", expect.stringContaining("interval"));
    }
  });

  it("値エラーには未エンコードの可能性を添える", () => {
    // URL 側のクエリ interval=60 が本パラメータとして解釈される
    const result = parse("?pdf=https://example.com/a.pdf?x=1&interval=60");
    expect(result.status).toBe("invalid");
    expect(result).toHaveProperty("reason", expect.stringContaining("encodeURIComponent"));
  });

  it("URL と autoplay / interval が両方不正なら URL のエラーを返す", () => {
    const result = parse("?pdf=not-a-url&autoplay=yes&interval=4");
    expect(result).toEqual({ status: "invalid", reason: "URL の形式が正しくありません" });
  });

  it("pdf がなければ autoplay / interval だけでは none", () => {
    expect(parse("?autoplay=1&interval=5")).toEqual({ status: "none" });
  });

  it("既知以外のパラメータとの併用は未エンコードとして拒否する", () => {
    const result = parse(`?${PDF}&autoplay=1&v=1`);
    expect(result.status).toBe("invalid");
    expect(result).toHaveProperty("reason", expect.stringContaining("encodeURIComponent"));
  });

  it("同じパラメータの重複は未エンコードとして拒否する", () => {
    // URL 側のクエリに同名キーがあると、どちらを採るかで別の URL になる
    for (const search of [
      "?pdf=https://example.com/a.pdf?x=1&pdf=2",
      `?${PDF}&interval=5&interval=3`,
    ]) {
      const result = parse(search);
      expect(result.status).toBe("invalid");
      expect(result).toHaveProperty("reason", expect.stringContaining("encodeURIComponent"));
    }
  });

  it("URL として解釈できない値を拒否する", () => {
    expect(parse("?pdf=not-a-url").status).toBe("invalid");
    // 相対パスは絶対 URL ではないため受け付けない
    expect(parse("?pdf=%2Fdocs%2Fa.pdf").status).toBe("invalid");
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
