class Laser {
    start;
    finish;
    length;

    colour = 'rgba(247, 239, 7, 0.8)';

    constructor(start, finish, length) {
        this.start = start;
        this.finish = finish;
        this.length = length;
    }

    setStart(vec) {
        this.start = vec;
    }

    setFinish(vec) {
        this.finish = vec;
    }

    show() {
        stroke(this.colour);
        line(this.start.x, this.start.y, this.finish.x, this.finish.y);
    }
}