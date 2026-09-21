/**
 * 従来型スクロールバーの厚み（px）を計測する。オーバーレイ型では 0。
 * 実際のスクロールコンテナはバーが出ていない間は計測できないため、probe 要素で代用する。
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
 * 高さフィットに使う高さ。
 * contentRect / clientHeight は横スクロールバーの出入りで増減し、それがページ高さの
 * 増減を招いて振動するため、バーの有無で変わらない offsetHeight から常にバー厚み分を引く。
 */
export function fitHeightOf(offsetHeight: number, scrollbarThickness: number): number {
  return Math.max(0, offsetHeight - scrollbarThickness);
}
