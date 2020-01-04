import SnakePlayer from './snake';
type Class = new (...args: any[]) => Class;

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
  private clientIdArr: [];
  private countEnemys: number;
  private enemyPosX: number;
  private enemyPosY: number;
  private newEnemyIDs: [];
  private posX: number;
  private posY: number;
  private snl: any;
  public snake: any;
  public player: any;
  public snakeEnemy: any;
  public snakeEnemys: any;
  public enemyColor: string;
  public size: number;
  public apple: {};
  public speed: number;
  public container: HTMLElement;
  public trophy: HTMLElement;
  public coin: HTMLElement;
  public infoBox: HTMLElement;

  constructor(cnv: HTMLCanvasElement, io) {
    // this.socket = io('http://localhost:3000');
    this.socket = io;
    this.clientId = null;
    this.enemyId = null;
    this.clientIdArr = [];
    this.trophy = document.querySelector('#thropy');
    this.coin = document.querySelector('#coin');
    this.infoBox = document.querySelector('#infoBox');
    this.container = document.querySelector('#gameBox');
    this.container.style.height =
      (this.container.clientHeight - this.infoBox.clientHeight).toString() +
      'px';
    // console.log(this.container.clientHeight);
    this.canvas = cnv;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;

    this.context = this.canvas.getContext('2d');
    this.size = Math.round(this.canvas.width / 50);
    this.xEnd = Math.round(this.canvas.width / this.size) * this.size;
    this.yEnd = Math.round(this.canvas.height / this.size) * this.size;
    this.directionLock = false;
    this.direction = this.getRandomDirection();
    //this.posX = Math.floor(Math.random() * this.canvas.width);
    //this.posY = Math.floor(Math.random() * this.canvas.height);
    this.posX =
      Math.round(
        this.random(this.size, this.canvas.width - this.size) / this.size,
      ) * this.size;
    this.posY =
      Math.round(
        this.random(this.size, this.canvas.height - this.size) / this.size,
      ) * this.size;

    this.snake = new SnakePlayer(
      this.posX,
      this.posY,
      null,
      '#ccc',
      this.direction,
    ).snake();
    this.snakeEnemy = [];
    this.snakeEnemys = new Set();
    this.enemyColor;
    this.player = null;
    this.apple = {};
    this.enemyDirection = 'left';
    this.speed = 200;
    this.countEnemys = 0;
    this.enemyPosX = null;
    this.enemyPosY = null;
    this.newEnemyIDs = [];

    this.socket.on('clientId', id => {
      this.clientId = id;
      this.snake[0].id = id;
      this.socket.emit('enemyId', this.snake[0]);
    });

    this.socket.on('enemyId', id => {
      this.snakeEnemys.clear();
      this.newEnemyIDs = id;
      [...this.newEnemyIDs].forEach(_id => {
        if (_id.id !== this.clientId) {
          this.enemyColor = this.getRandomColor();
          let snl = new SnakePlayer(
            _id.x,
            _id.y,
            _id.id,
            this.enemyColor,
            _id.direction,
          ).enemySnake();
          this.snakeEnemys.add(snl);
        }
      });
    });

    this.socket.on('enemyDirection', data => {
      this.snakeEnemys.forEach((i, k) => {
        if (i[0].enemyId === data.id) {
          i[0].direction = data.direction;
        }
      });
    });

    // this.socket.on('tail', enemy => {
    // console.log('ENEMY GOT APPLE ');
    // this.snakeEnemys.forEach((i, k) => {
    // if (enemy[0].id === i[0].enemyId) {
    // // i.push(i);
    // i=enemy;
    // }
    // });
    // console.log(this.snakeEnemys);
    // });

    this.socket.on('snakeTick', enemy => {
      // console.log('ENEMY SNAKE TICK', enemy);
      let newEnemy = enemy.snake;
      newEnemy[0].id = enemy.id;
      newEnemy[0].enemyId = enemy.id;
      delete newEnemy[0].id;
      // console.log('NEW ENEMY', newEnemy);

      this.snakeEnemys.forEach((i, k) => {
        // console.log(newEnemy[0].enemyId , i[0].enemyId)
        if (newEnemy[0].enemyId === i[0].enemyId) {
          // console.log('ENEMY ARR INSIDE B: ', i);
          for(let j = 0 ; j < newEnemy.length ; j++){ 
          i[j]=newEnemy[j];
          // console.log('ENEMY ARR INSIDE A: ', i);
          // i[0].x = enemy.x;
          // i[0].y = enemy.y;
          }
        }
      });
      // console.log('ENEMY ARR OUTSIDE', this.snakeEnemys);
    });
    this.socket.on('start', data => {
      // console.log(data);
      const startBtn: HTMLElement = document.querySelector('#startBtn');
      startBtn.style.display = 'none';
      this.start();
    });
    this.socket.on('user disconnected', enemyID => {
      // console.log('someone has gone ', enemyID);
    });
  }
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  start() {
    this.setApple(); // SET APPLE

    window.setTimeout(() => this.tick(), this.speed);
    // window.setTimeout(() => this.enemyTick(), this.speed);

    window.requestAnimationFrame(() => this.draw());

    window.addEventListener('keydown', e => this.keyDown(e));
    window.addEventListener('resize', () => this.resize());
  }

  setApple() {
    this.apple.x =
      Math.round(
        this.random(this.size, this.canvas.width - this.size) / this.size,
      ) * this.size;
    this.apple.y =
      Math.round(
        this.random(this.size, this.canvas.height - this.size) / this.size,
      ) * this.size;
    this.socket.emit('apple', this.apple);
    this.socket.on('apple', a => {
      // console.log('APPLE: ', a);
      this.apple = a;
    });
  }
  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // APPLE ///
    this.context.fillStyle = 'red';
    this.context.fillRect(this.apple.x, this.apple.y, this.size, this.size);

    //  ENEMY /////
    this.snakeEnemys.forEach((enemy, k) => {
    // console.log(enemy)
      for (let i = 0; i < enemy.length; i += 1) {
        const s = enemy[i];
        this.context.fillStyle = s.color;
        this.context.fillRect(s.x, s.y, this.size, this.size);
      }
      // console.log("DRAW ENEMY")
      // console.log(enemy)
    });

    /// PLAYER /////
    // console.log(this.snake)
    for (let i = 0; i < this.snake.length; i += 1) {
      const s = this.snake[i];
      this.context.fillStyle = s.color;
      this.context.fillRect(s.x, s.y, this.size, this.size);
    }

    window.requestAnimationFrame(() => this.draw());
  } // end draw

  // enemyTick() {
  // this.snakeEnemys.forEach((enemy, k) => {
  // for (let i = enemy.length - 1; i >= 0; i--) {
  // if (
  // i === 0 &&
  // enemy[i].x === this.apple.x &&
  // enemy[i].y === this.apple.y
  // ) {
  // enemy.push({});

  // this.speed *= 0.99;
  // this.setApple();
  // const c = document.createElement('i');
  // c.classList.add('nes-icon', 'coin');
  // this.coin.appendChild(c);
  // }
  // const s = enemy[i];
  // if (i == 0) {
  // switch (s.direction) {
  // case 'right':
  // if (s.x > this.canvas.width) s.x = 0;
  // else s.x += this.size;
  // break;
  // case 'down':
  // if (s.y > this.canvas.height) s.y = 0;
  // else s.y += this.size;
  // break;
  // case 'left':
  // if (s.x < 0) s.x = this.xEnd;
  // else s.x -= this.size;
  // break;
  // case 'up':
  // if (s.y < 0) s.y = this.yEnd;
  // else s.y -= this.size;
  // }

  // for (let j = 1; j < enemy.length; j += 1) {
  // if (enemy[0].x === enemy[j].x && enemy[0].y === enemy[j].y) {
  // alert('GAME OVER');
  // window.location.reload();
  // }
  // }
  // } else {
  // enemy[i].x = enemy[i - 1].x;
  // enemy[i].y = enemy[i - 1].y;
  // }
  // }
  // });
  // window.setTimeout(() => this.enemyTick(), this.speed);
  // this.directionLock = false;
  // }
  tick() {
    for (let i = this.snake.length - 1; i >= 0; i--) {
      if (
        i === 0 &&
        this.snake[i].x === this.apple.x &&
        this.snake[i].y === this.apple.y
      ) {
        this.snake.push({});

        //** Todo : enemy tail logic

        this.speed *= 0.99;
        this.setApple();
        const c = document.createElement('i');
        c.classList.add('nes-icon', 'coin');
        this.coin.appendChild(c);
        // console.log('PLAYER GOT APPLE', this.snake[i]);
      }
      const s = this.snake[i];
      if (i == 0) {
        switch (this.direction) {
          case 'right':
            if (s.x > this.canvas.width) s.x = 0;
            else s.x += this.size;
            break;
          case 'down':
            if (s.y > this.canvas.height) s.y = 0;
            else s.y += this.size;
            break;
          case 'left':
            if (s.x < 0) s.x = this.xEnd;
            else s.x -= this.size;
            break;
          case 'up':
            if (s.y < 0) s.y = this.yEnd;
            else s.y -= this.size;
        }

        for (let j = 1; j < this.snake.length; j += 1) {
          if (
            this.snake[0].x === this.snake[j].x &&
            this.snake[0].y === this.snake[j].y
          ) {
            alert('GAME OVER');
            window.location.reload();
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
    this.socket.emit('snakeTick', {id: this.snake[0].id, snake: this.snake});

    window.setTimeout(() => this.tick(), this.speed);
    this.directionLock = false;
  }
  keyDown(e) {
    if (!this.directionLock) {
      this.directionLock = true;
      const newDirection = e.key.substr(5).toLowerCase();

      if (this.direction === 'left' && newDirection !== 'right') {
        this.direction = newDirection;
        this.socket.emit('enemyDirection', {
          id: this.snake[0].id,
          direction: this.direction,
        });
      }
      // this.socket.emit('direction', this.direction);
      if (this.direction === 'up' && newDirection !== 'down') {
        this.direction = newDirection;
        this.socket.emit('enemyDirection', {
          id: this.snake[0].id,
          direction: this.direction,
        });
      }
      // this.socket.emit('direction', this.direction);
      if (this.direction === 'down' && newDirection !== 'up') {
        this.direction = newDirection;
        this.socket.emit('enemyDirection', {
          id: this.snake[0].id,
          direction: this.direction,
        });
      }
      // this.socket.emit('direction', this.direction);
      if (this.direction === 'right' && newDirection !== 'left') {
        this.direction = newDirection;
        this.socket.emit('enemyDirection', {
          id: this.snake[0].id,
          direction: this.direction,
        });
      }
      // this.socket.emit('direction', this.direction);
    }
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
    let items = ['up', 'down', 'left', 'right'];
    return items[Math.floor(Math.random() * items.length)];
  }
  getRandomColor() {
    // var letters = '0123456789ABCDEF';
    var letters = [
      'Orange',
      'White ',
      'Beige',
      'Blue',
      'BurlyWood',
      'Chocolate',
      'Coral',
      'Cornsilk',
      'DarkCyan ',
      'Fuchsia',
      'Gold',
      'GreenYellow',
      'HotPink',
      'LightSteelBlue',
      'MediumPurple',
      'OliveDrab',
    ];
    // var color = '#';
    var color = '';
    for (var i = 0; i < 6; i++) {
      // color += letters[Math.floor(Math.random() * 16)];
      color = letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
