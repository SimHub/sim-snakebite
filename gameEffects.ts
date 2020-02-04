export default class GFX {
  constructor() {}
  static neonTFX(score: string, pos: {}) {
    console.log(pos);
    const gameBox = document.querySelector("#gameBox");
    const _efx = document.createElement("div");
    _efx.id = "pointFX";
    _efx.classList.add("animated", "bounceOutLeft", "slow");
    // _efx.innerText = "+" + score;
    _efx.innerHTML = `<div class="neon">
            <span class="text" data-text="+${score}">+${score}</span>
            <span class="gradient"></span>
            <span class="spotlight"></span>
        </div>`;
    // _efx.style.color = "red";
    _efx.style.position = "absolute";
    _efx.style.left = pos.x + "px";
    _efx.style.top = pos.y + "px";
    gameBox.appendChild(_efx);

    // // setTimeout(function() {
    // // _efx.remove();
    // // }, 2000);
  }
}
