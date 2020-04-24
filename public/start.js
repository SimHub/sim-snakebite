import "bulma/css/bulma.css";
import "bulma-divider/dist/css/bulma-divider.min.css";
import "bulma-tooltip/dist/css/bulma-tooltip.min.css";
import "typeface-press-start-2p";
import "../node_modules/nes.css/css/nes.css";
import $ from "jquery";
import ClipboardJS from "../node_modules/clipboard/dist/clipboard.js";
import "typeface-orbitron";
import IP from "../utils";

const startBtn = document.querySelector("#start");
const createRoom = document.querySelector("#createRoom");
const newRandomCode = document.querySelector("#newRandomCode");
const joinRoom = document.querySelector("#joinRoom");
const joinRoomCode = document.querySelector("#joinRoomCode");
const btn = document.querySelector("#btn");
const codeUrlLength = 20;
let random = randCode(20);
newRandomCode.value = random;
joinRoomCode.innerHTML = " ";

function randCode(length) {
  let code = "";
  let rand = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++)
    code += rand.charAt(Math.floor(Math.random() * rand.length));
  return code;
}

//// JOIN ROOM ////
$("#urlCodeLengthInfo").html(codeUrlLength);

function listener(event) {
  let val = joinRoomCode.value;
  if (val.length >= codeUrlLength) {
    joinRoom.removeAttribute("disabled");
    $("#joinCheckIcon")
      .removeClass()
      .addClass("far fa-check-circle custom-icon")
      .css("color", "green");
    joinRoom.addEventListener("click", (e) => {
      e.preventDefault();
      if (newRandomCode.value) {
        location.assign(`${IP.http}${IP.ip}:${IP.port}/${val}
`);
      }
    });
  } else {
    console.log("NOOP");
    joinRoom.setAttribute("disabled", "true");
    $("#joinCheckIcon")
      .removeClass()
      .addClass("far fa-question-circle custom-icon")
      .css("color", "grey");
  }
}

//// TABS ////
$(".tablinks").on("click", (e) => {
  let target = e.target;
  if (target.parentNode.dataset.link === "join") {
    joinRoomCode.innerHTML = "";
    joinRoomCode.value = "";
    joinRoom.setAttribute("disabled", "true");
    $("#joinCheckIcon")
      .removeClass()
      .addClass("far fa-question-circle custom-icon")
      .css("color", "grey");
    joinRoomCode.addEventListener("input", listener);
  }
  $(".tablinks").each((key, item) => {
    $(item).removeClass("is-active");
    $(target).parent().addClass("is-active");
    let dataId = $(target).parent().data("link");
    console.log(dataId);
    $(".tabcontent").each((k, i) => {
      $(i).css("display", "none");
    });
    $(`#${dataId}`).css("display", "block");
  });
});

//// CLIPBOARD ////
var clipboard = new ClipboardJS(btn);
clipboard.on("success", clip);
clipboard.on("error", function (e) {
  console.log(e);
});
function clip(e) {
  console.log(e);
  $("#btn").removeClass("far fa-copy").addClass("fas fa-copy");
  $("#joinRoomCode").data("tooltip", "copied");
  $("#copiedPopup").css("display", "block");
  setTimeout(() => {
    $("#copiedPopup").css("display", "none");
  }, 2000);
}

/* ///// START GAME //// */
startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (newRandomCode.value) {
    location.assign(`${IP.http}${IP.ip}:${IP.port}/${newRandomCode.value}
`);
  }
});
