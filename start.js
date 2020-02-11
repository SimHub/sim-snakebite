import "bulma/css/bulma.css";
import IP from "./utils";

const startBtn = document.querySelector("#start");
const createRoom = document.querySelector("#createRoom");
const newRandomCode = document.querySelector("#newRandomCode");

createRoom.addEventListener("click", function(e) {
  e.preventDefault();
  let random = randCode(20);
  newRandomCode.value = random;
  //toBeVeryfied.text(random);
  newRandomCode.value = random;
  startBtn.setAttribute("href", "/" + random);
});

function randCode(length) {
  let code = "";
  let rand = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++)
    code += rand.charAt(Math.floor(Math.random() * rand.length));
  return code;
}

///// START GAME ////
startBtn.addEventListener("click", () => {
  location.assign(`${IP.http}${IP.ip}:${IP.port}/game.html`);
  // location.reload(true);
});
