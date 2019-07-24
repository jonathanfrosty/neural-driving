class Edge {
    start;
    finish;

    colour = 'rgb(7, 118, 255)'

    constructor(start, finish) {
        this.start = start;
        this.finish = finish;
    }

    show() {
        push();

        stroke(this.colour)
        strokeWeight(4);
        line(this.start.x, this.start.y, this.finish.x, this.finish.y)

        pop();
    }
}