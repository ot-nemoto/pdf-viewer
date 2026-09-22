import { afterEach, describe, expect, it, vi } from "vitest";
import { fitExtentOf, measureScrollbarThickness } from "./scrollbar";

describe("measureScrollbarThickness", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // jsdom はレイアウトを持たないため、offsetHeight / clientHeight をスタブする
  const stubSizes = (offsetHeight: number, clientHeight: number) => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(offsetHeight);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
  };

  it("offsetHeight と clientHeight の差をバー厚みとして返す", () => {
    stubSizes(100, 85);
    expect(measureScrollbarThickness()).toBe(15);
  });

  it("オーバーレイ型（差がない）では 0", () => {
    stubSizes(100, 100);
    expect(measureScrollbarThickness()).toBe(0);
  });

  it("差が負になる場合も 0 に丸める", () => {
    stubSizes(90, 100);
    expect(measureScrollbarThickness()).toBe(0);
  });

  it("計測後に probe 要素を残さない", () => {
    stubSizes(100, 85);
    const before = document.body.childElementCount;
    measureScrollbarThickness();
    expect(document.body.childElementCount).toBe(before);
  });
});

describe("fitExtentOf", () => {
  it("offset 寸法からバー厚みを引く", () => {
    expect(fitExtentOf(600, 15)).toBe(585);
  });

  it("バー厚み 0（オーバーレイ型）ならそのまま", () => {
    expect(fitExtentOf(600, 0)).toBe(600);
  });

  it("バー厚みが高さを上回っても負にならない", () => {
    expect(fitExtentOf(10, 15)).toBe(0);
  });

  it("offset 寸法が 0（未レイアウト）なら 0", () => {
    expect(fitExtentOf(0, 15)).toBe(0);
  });
});
