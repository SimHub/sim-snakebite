import "bulma/css/bulma.css";
import IP from "./utils";

const startBtn = document.querySelector("#start");
startBtn.addEventListener("click", () => {
  location.assign(`${IP.http}${IP.ip}:${IP.port}/game.html`);
  // location.reload(true);
});
