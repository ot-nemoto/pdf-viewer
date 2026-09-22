/**
 * 従来型スクロールバーの厚み（px）を計測する。オーバーレイ型では 0。
 * 実際のスクロールコンテナはバーが出ていない間は計測できないため、probe 要素で代用する。
 * 縦バーと横バーは同じ厚みである前提で、横バー側（offsetHeight - clientHeight）で代表させる。
 */
export function measureScrollbarThickness(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;width:100px;height:100px;overflow:scroll";
  document.body.appendChild(probe);
  const thickness = probe.offsetHeight - probe.clientHeight;
  probe.remove();
  return Math.max(0, thickness);
}

/**
 * フィットに使う寸法（幅・高さ共通）。
 * contentRect / clientWidth / clientHeight はスクロールバーの出入りで増減し、それがページ
 * 寸法の増減を招いて振動するため、バーの有無で変わらない offsetWidth / offsetHeight から
 * 常にバー厚み分を引く。
 */
export function fitExtentOf(offsetExtent: number, scrollbarThickness: number): number {
  return Math.max(0, offsetExtent - scrollbarThickness);
}
