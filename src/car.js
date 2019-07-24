class Car {
    r = 12;
    drivingColour = color('rgb(158, 2, 206)')
    crashedColour = color('rgb(244, 22, 22)')

    pos = createVector(0, 0);
    vel = createVector(0, 0);

    angle = TAU;

    isApplyingForce = false;

    maxSpeed;
    turningAbility;

    laserCount;
    minLaserLength;
    maxLaserLength;

    laserLengths = [];
    lasers = [];

    neuralInputs = [];

    forward = false;
    backward = false;
    left = false;
    right = false;
    crashed = false;

    constructor(maxSpeed, turningAbility, laserCount, minLaserLength, maxLaserLength) {
        this.positionCar();

        this.maxSpeed = maxSpeed;
        this.turningAbility = turningAbility;
        this.laserCount = laserCount;
        this.minLaserLength = minLaserLength;
        this.maxLaserLength = maxLaserLength;

        this.laserLengths = this.determineLaserLengths();
        this.lasers = new Array(this.laserCount).fill(null);
    }

    positionCar() {
        let spawnCell = grid.carSpawnCell;
        let cellTopLeft = spawnCell.topLeft.copy();
        let halfcellSize = grid.cellSize / 2;
        this.pos = cellTopLeft.add(halfcellSize, halfcellSize);
    }

    applyAction() {
        this.isApplyingForce = false;
        if(this.forward) { this.move(0.2); this.isApplyingForce = true; }
        if(this.backward) { this.move(-0.2); this.isApplyingForce = true }
        if(this.left) this.turn(-0.1);
        if(this.right) this.turn(0.1);
    }

    isMoving() {
        return this.vel.mag() > 0;
    }

    move(val) {
        this.vel.add(val, val);
        this.vel.limit(this.maxSpeed);
    }

    turn(val) {
        let speedFactor = map(this.vel.mag(), 0, this.maxSpeed, 1, 0.7); // poorer at turning at greater speeds
        this.angle += speedFactor * val * this.turningAbility;
    }

    determineLaserLengths() {
        if(this.minLaserLength >= this.maxLaserLength) return new Array(this.laserCount).fill(this.maxLaserLength);

        let increasingLaserLengths = [this.minLaserLength];

        let currentLength = this.minLaserLength;

        let elementsUntilMaxLength = ceil((this.laserCount / 2) - 1);
        let increment = (this.maxLaserLength - this.minLaserLength) / elementsUntilMaxLength;
        
        while(currentLength.toFixed(2) < this.maxLaserLength) {        
            currentLength += increment;
            increasingLaserLengths.push(currentLength);                       
        }

        let decreasingLaserLengths = [...increasingLaserLengths].reverse();
        if(this.laserCount % 2 == 1) decreasingLaserLengths.shift();

        return increasingLaserLengths.concat(decreasingLaserLengths);
    }

    updateLasers() {        
        const angleIncrement = PI / (this.laserCount - 1);

        let laserAngle = this.angle - PI/2;

        for(let i = 0; i < this.laserCount; i++) {
            let endVector = p5.Vector.fromAngle(laserAngle, this.laserLengths[i]);

            let laser = this.lasers[i];
            if(laser == null) {
                laser = new Laser(this.pos, p5.Vector.add(this.pos, endVector), this.laserLengths[i]);
            } else {
                laser.setStart(this.pos)
                laser.setFinish(p5.Vector.add(this.pos, endVector));
            }

            this.lasers[i] = laser;

            laserAngle += angleIncrement;
        }
    }

    drawLasers() {
        for(let laser of this.lasers) {
            laser.show();
        }
    }

    determineLaserIntersection(laser) {        
        let closestIntersect = { x: false, y: false };
        let closestDistance = laser.length;

        for(let edge of grid.trackEdges) {
            let intersect = collideLineLine(laser.start.x, laser.start.y, laser.finish.x, laser.finish.y, edge.start.x, edge.start.y, edge.finish.x, edge.finish.y, true);

            if(intersect.x && intersect.y) {
                if(!closestIntersect.x && !closestIntersect.y) {
                    closestIntersect = intersect;
                    closestDistance = dist(this.pos.x, this.pos.y, closestIntersect.x, closestIntersect.y);
                } else {
                    let distance = dist(this.pos.x, this.pos.y, intersect.x, intersect.y);
                    if(distance < closestDistance) {
                        closestIntersect = intersect;
                        closestDistance = distance;
                    }
                }
            }
        }

        if(lasersVisible && closestIntersect.x && closestIntersect.y) {
            push();

            fill(color('red'));
            noStroke();
            ellipse(closestIntersect.x, closestIntersect.y, 10);

            pop();
        }
        
        return closestDistance;
    }

    updateNeuralInputs() {
        let inputs = [];
        for(let i = 0; i < this.laserCount; i++) {
            let actualDistance = this.determineLaserIntersection(this.lasers[i]);
            let normalisedDistance = map(actualDistance, 0, this.laserLengths[i], 0, 1);
            inputs.push(Number(normalisedDistance.toFixed(4)));
        }

        this.neuralInputs = inputs;
    }

    checkCollision() {
        for(let i = 0; i < this.neuralInputs.length; i++) {
            let normalisedDistance = this.neuralInputs[i];
            let actualDistance = map(normalisedDistance, 0, 1, 0, this.laserLengths[i]);
            if(actualDistance < this.r * 0.5) this.crashed = true;
        }
    }

    show() {
        if(!gridEditingMode && !this.crashed && lasersVisible) this.drawLasers();      

        translate(this.pos.x, this.pos.y);
        rotate(this.angle + PI/2);

        fill(this.crashed ? this.crashedColour : this.drivingColour);
        noStroke();
        
        beginShape();
        vertex(0, -this.r);
        vertex(-this.r * 0.5, this.r);
        vertex(this.r * 0.5, this.r);
        endShape(CLOSE);

        if(trainingMode) {
            rotate(-PI/2);
            noStroke();
            fill(255);
            textSize(9);
            text('T', -8, -3.5);
        }
    }

    update() {
        this.applyAction();

        let newVelX = this.vel.x * cos(this.angle);
        let newVelY = this.vel.y * sin(this.angle);

        this.pos.add(newVelX, newVelY);

        if(!this.isApplyingForce) this.vel.mult(0.95);
        if(!this.isApplyingForce && this.vel.mag() < 0.1) this.vel.mult(0);

        this.updateLasers();
        this.updateNeuralInputs();
        this.checkCollision();
    }
}