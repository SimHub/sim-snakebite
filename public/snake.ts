export default class SnakePlayer {
  private x: number;
  private y: number;
  private id: number;
  private direction: string;
  private color: string;
  private comboFX: string;
  private room: string;
  private sn: [{}];
  constructor(posX, posY, id, room, color, comboFX, direction) {
    this.x = posX;
    this.y = posY;
    this.id = id;
    this.room = room;
    this.color = color;
    this.comboFX = comboFX;
    this.direction = direction;
  }
  enemySnake() {
    return [
      {
        x: this.x,
        y: this.y,
        enemyId: this.id,
        room: this.room,
        color: this.color,
        comboFX: this.comboFX,
        direction: this.direction
      }
    ];
  }
  snake() {
    return [
      {
        x: this.x,
        y: this.y,
        id: this.id,
        room: this.room,
        color: this.color,
        comboFX: this.comboFX,
        direction: this.direction
      }
    ];
  }
}
