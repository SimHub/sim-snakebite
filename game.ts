import SnakePlayer from "./snake";

export default class Snake {
  private canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private direction: string;
  private enemyDirection: string;
  private directionLock: boolean;
  private xEnd: number;
  private yEnd: number;
  private socket: any;
  private clientId: string;
  private enemyId: [] | string;
  private enemyChange: boolean;
  private clientIdArr: [];
  private countEnemys: number;
  private enemyPosX: number;
  private enemyPosY: number;
  private newEnemyIDs: [];
  private posX: number;
  private posY: number;
  private snl: any;
  private FPS: number;
  private snake: any;
  private player: any;
  private snakeEnemy: any;
  private snakeEnemys: any;
  private enemyColor: string;
  private size: number;
  private appleSize: number;
  private apple: {};
  private speed: number;
  private container: HTMLElement;
  private trophy: HTMLElement;
  private coin: HTMLElement;
  private infoBox: HTMLElement;
  private score: number;

  public isPaused: boolean;

  constructor(cnv: HTMLCanvasElement, io) {
    this.score = 0;
    this.isPaused = false;
    this.socket = io;
    this.clientId = null;
    this.enemyId = null;
    this.clientIdArr = [];
    this.trophy = document.querySelector("#trophy");
    this.coin = document.querySelector("#coin");
    this.infoBox = document.querySelector("#infoBox");
    this.container = document.querySelector("#gameBox");
    // this.container.style.height =
    // (this.container.clientHeight - this.infoBox.clientHeight).toString() +
    // 'px';
    // console.log([this.container]);
    this.canvas = cnv;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;

    this.context = this.canvas.getContext("2d");
    this.size = Math.round(this.canvas.width / 50);
    this.appleSize = Math.round(this.canvas.width / 50);
    this.xEnd = Math.round(this.canvas.width / this.size) * this.size;
    this.yEnd = Math.round(this.canvas.height / this.size) * this.size;
    this.directionLock = false;
    this.direction = this.getRandomDirection();
    // this.posX = Math.floor(Math.random() * this.canvas.width);
    // this.posY = Math.floor(Math.random() * this.canvas.height);
    this.posX =
      Math.round(
        this.random(this.size, this.canvas.width - this.size) / this.size
      ) * this.size;
    this.posY =
      Math.round(
        this.random(this.size, this.canvas.height - this.size) / this.size
      ) * this.size;

    this.snake = new SnakePlayer(
      this.posX,
      this.posY,
      null,
      this.getRandomColor(),
      this.direction
    ).snake();
    this.snakeEnemy = [];
    this.snakeEnemys = new Set();
    this.enemyColor;
    this.player = null;
    this.apple = {};
    this.enemyDirection = "left";
    this.speed = 200;
    this.countEnemys = 0;
    this.enemyPosX = null;
    this.enemyPosY = null;
    this.newEnemyIDs = [];
    this.enemyChange = false;

    // color //
    this.gradient = this.context.createLinearGradient(0, 0, 0, 170);
    this.gradient.addColorStop(0, "black");
    this.gradient.addColorStop(0.5, "red");
    this.gradient.addColorStop(1, "white");

    //
    /// socket con ///
    this.socket.on("clientId", id => {
      this.clientId = id;
      this.snake[0].id = this.clientId;
      this.socket.emit("enemyId", this.snake[0]);
    });

    this.socket.on("enemyId", id => {
      this.snakeEnemys.clear();
      console.log("new enemy - ", this.snakeEnemys);
      this.newEnemyIDs = id;
      [...this.newEnemyIDs].forEach(_id => {
        console.log(_id);
        if (_id.id !== this.clientId) {
          // this.enemyColor = this.getRandomColor();
          let snl = new SnakePlayer(
            _id.x,
            _id.y,
            _id.id,
            _id.color,
            _id.direction
          ).enemySnake();
          this.snakeEnemys.add(snl);
        }
      });
    });

    this.socket.on("enemyDirection", data => {
      this.snakeEnemys.forEach((i, k) => {
        if (i[0].enemyId === data.id) {
          i[0].direction = data.direction;
        }
      });
    });

    this.socket.on("snakeTick", enemy => {
      let newEnemy = enemy.snake;
      newEnemy[0].id = enemy.id;
      newEnemy[0].enemyId = enemy.id;
      delete newEnemy[0].id;

      this.snakeEnemys.forEach((i, k) => {
        if (newEnemy[0].enemyId === i[0].enemyId) {
          newEnemy[0].color = i[0].color;
          for (let j = 0; j < newEnemy.length; j++) {
            i[j] = newEnemy[j];
          }
        }
      });
      // console.log('ENEMY ARR OUTSIDE', this.snakeEnemys);
    });
    this.socket.on("apple", a => {
      this.apple = a;
    });

    this.socket.on("user disconnected", enemyID => {
      console.log("someone has gone ", enemyID);
      this.snakeEnemys.forEach(enemy => {
        console.log(enemy[0].enemyId, enemyID);
        if (enemy[0].enemyId === enemyID) {
          console.log(enemy[0].enemyId === enemyID);
          console.log(enemy);
          this.snakeEnemys.delete(enemy);
        }
      });
      console.log(this.snakeEnemys);
    });

    //#### START GAME ####/
    // this.socket.on('start', data => {
    // const startBtn: HTMLElement = document.querySelector('#startBtn');
    // startBtn.style.display = 'none';
    this.start();
    // });
  }
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  start() {
    this.setApple(); // SET APPLE

    window.setTimeout(() => {
      this.tick(), this.speed;
    }, 1000 / this.FPS); // LOOP

    window.requestAnimationFrame(() => this.draw());

    window.addEventListener("keydown", e => this.keyDown(e));
    window.addEventListener("resize", () => this.resize());
  }

  setApple() {
    this.apple.x =
      Math.round(
        this.random(this.appleSize, this.canvas.width - this.appleSize) /
          this.appleSize
      ) * this.appleSize;
    this.apple.y =
      Math.round(
        this.random(this.appleSize, this.canvas.height - this.appleSize) /
          this.appleSize
      ) * this.appleSize;
    this.socket.emit("apple", this.apple);
  }
  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // APPLE ///
    // this.context.fillStyle = 'red';
    this.context.fillStyle = this.gradient;

    // this.context.shadowColor = 'orange'; // string
    // this.context.shadowOffsetX = 0; // integer
    // this.context.shadowOffsetY = 0; // integer
    // this.context.shadowBlur = 10;

    this.context.fillRect(this.apple.x, this.apple.y, this.size, this.size);
    /////////

    //  ENEMY /////
    this.snakeEnemys.forEach((enemy, k) => {
      // console.log(enemy);
      for (let i = 0; i < enemy.length; i += 1) {
        const s = enemy[i];
        this.context.fillStyle = s.color;
        this.context.fillRect(s.x, s.y, this.size, this.size);
      }
    });
    ///////

    /// PLAYER /////
    for (let i = 0; i < this.snake.length; i += 1) {
      const s = this.snake[i];
      this.context.fillStyle = s.color;
      this.context.fillRect(s.x, s.y, this.size, this.size);
    }
    ///////////////

    if (!this.isPaused) window.requestAnimationFrame(() => this.draw());
  } // end draw

  tick() {
    for (let i = this.snake.length - 1; i >= 0; i--) {
      if (
        // (i === 0 &&
        // this.hitTestPoint(
        // this.snake[i].x,
        // this.snake[i].y,
        // this.appleSize,
        // this.appleSize,
        // this.apple.x,
        // this.apple.y
        // )) ||
        i == 0 &&
        this.snake[i].x === this.apple.x &&
        this.snake[i].y === this.apple.y
      ) {
        this.snake.push({});

        //** Todo : enemy tail logic

        this.speed *= 0.99;
        this.setApple();
        // const c = document.createElement('i');
        // c.classList.add('nes-icon', 'coin');
        // this.coin.appendChild(c);
        // console.log('PLAYER GOT APPLE', this.snake[i]);
        this.score++;
        this.appleBiteScore(this.score);
      }
      const s = this.snake[i];
      if (i == 0) {
        switch (this.direction) {
          case "right":
            if (s.x > this.canvas.width) s.x = 0;
            else s.x += this.size;
            break;
          case "down":
            if (s.y > this.canvas.height) s.y = 0;
            else s.y += this.size;
            break;
          case "left":
            if (s.x < 0) s.x = this.xEnd;
            else s.x -= this.size;
            break;
          case "up":
            if (s.y < 0) s.y = this.yEnd;
            else s.y -= this.size;
        }

        for (let j = 1; j < this.snake.length; j += 1) {
          if (
            this.snake[0].x === this.snake[j].x &&
            this.snake[0].y === this.snake[j].y
          ) {
            // alert("GAME OVER");
            this.socket.emit("gameover", this.snake[0]);
            // window.location.reload();
          }
        }
      } else {
        this.snake[i].x = this.snake[i - 1].x;
        this.snake[i].y = this.snake[i - 1].y;

        // this.socket.emit('tail', this.snake);
        ///** Todo : enemy tail logic
      }
    }

    // this.socket.emit('snakeTick', this.snake[0]);
    this.socket.emit("snakeTick", { id: this.snake[0].id, snake: this.snake });

    window.setTimeout(() => this.tick(), this.speed);
    this.directionLock = false;
  }
  keyDown(e) {
    if (!this.directionLock) {
      this.directionLock = true;
      const newDirection = e.key.substr(5).toLowerCase();

      let h = ["left", "right", "up", "down"];

      if (e.key === " ") {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
          this.draw();
        }
        console.log(this.isPaused);
      }
      if (h.includes(newDirection)) {
        if (this.direction === "left" && newDirection !== "right") {
          this.direction = newDirection;
        }
        if (this.direction === "up" && newDirection !== "down") {
          this.direction = newDirection;
        }
        if (this.direction === "down" && newDirection !== "up") {
          this.direction = newDirection;
        }
        if (this.direction === "right" && newDirection !== "left") {
          this.direction = newDirection;
        }
      }
    }
  }
  getclientID() {
    return this.clientId;
  }
  appleBiteScore(sc) {
    console.log(this.trophy.getAttribute("data-badge"));
    this.trophy.innerText = sc;
    console.log(this.trophy.getAttribute("data-badge"));
  }
  resize() {
    // console.log('RESIZE');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.xEnd = Math.round(this.canvas.width / this.size) * this.size;
    this.yEnd = Math.round(this.canvas.height / this.size) * this.size;

    this.setApple();
    this.draw();
  }
  getRandomDirection() {
    let items = ["up", "down", "left", "right"];
    return items[Math.floor(Math.random() * items.length)];
  }
  getRandomColor() {
    var letters = "0123456789ABCDEF";
    // var letters = [
    // 'Orange',
    // 'White ',
    // 'Beige',
    // 'Blue',
    // 'BurlyWood',
    // 'Chocolate',
    // 'Coral',
    // 'Cornsilk',
    // 'DarkCyan ',
    // 'Fuchsia',
    // 'Gold',
    // 'GreenYellow',
    // 'HotPink',
    // 'LightSteelBlue',
    // 'MediumPurple',
    // 'OliveDrab',
    // ];
    var color = "#";
    // var color = '';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
      // color = letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  hitTestPoint(x1, y1, w1, h1, x2, y2) {
    //x1, y1 = x and y coordinates of object 1
    //w1, h1 = width and height of object 1
    //x2, y2 = x and y coordinates of object 2 (usually midpt)
    if (x1 <= x2 && x1 + w1 >= x2 && y1 <= y2 && y1 + h1 >= y2) {
      console.log("COLLISION TRUE");
      return true;
    } else {
      // console.log('COLLISION FALSE');
      return false;
    }
  }
}
