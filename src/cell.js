class Cell {
    size;
    topLeft;
    topRight;
    bottomLeft;
    bottomRight;

    isTrack = false;
    hasChangedStateAlready = false;

    constructor(size, topLeft) {
        this.size = size;
        this.topLeft = topLeft;
        this.determineOtherVertices();
    }

    determineOtherVertices() {
        this.topRight = this.topLeft.copy().add(this.size, 0);
        this.bottomLeft = this.topLeft.copy().add(0, this.size);
        this.bottomRight = this.bottomLeft.copy().add(this.size, 0);
    }

    contains(x, y) {
        return (x >= this.topLeft.x && x < this.topRight.x && y >= this.topLeft.y && y < this.bottomLeft.y);
    }

    toggleState() {
        this.isTrack = !this.isTrack;
        this.hasChangedStateAlready = true;
    }

    resetStateChangedAlready() {
        this.hasChangedStateAlready = false;
    }

    show(gridEditingMode) {
        if(this.isTrack) {
            stroke(252);
            fill(252);
            square(this.topLeft.x, this.topLeft.y, this.size);
        } else {
            stroke(10);
            fill(10);
        }

        if(gridEditingMode) {
            strokeWeight(2);
            stroke(150);
            square(this.topLeft.x, this.topLeft.y, this.size);
        }        

        if(gridEditingMode && this == grid.carSpawnCell) {
            let textX = this.topLeft.x + this.size / 2;

            if(this.isTrack) fill(10);
            else fill(252);
            noStroke();
            textStyle(BOLD);
            textAlign(CENTER, TOP);
            text("SPAWN", textX, this.topLeft.y + 5)
        }
    }
}