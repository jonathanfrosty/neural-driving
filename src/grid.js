class Grid {
    padding = 30;

    numberOfCellsAcross;
    numberOfCellsDown;
    cellSize;
    cells = [];
    track = [];
    trackEdges = [];

    maxSavedTracks = 5;
    savedTracks = [[[false,true,true,true,true,true,false,false,false,true,true,true,true,true,false],[true,true,false,false,false,true,false,false,false,true,false,false,false,true,true],[true,false,false,false,false,true,true,true,true,true,false,false,false,false,true],[true,false,false,false,false,false,false,false,false,false,false,false,false,false,true],[true,false,false,false,false,true,true,true,true,true,false,false,false,false,true],[true,true,false,false,false,true,false,false,false,true,false,false,false,true,true],[false,true,true,true,true,true,false,false,false,true,true,true,true,true,false]],[[true,true,true,true,false,false,true,true,true,false,true,true,true,true,true],[true,false,false,true,true,false,true,false,true,false,true,false,false,false,true],[true,true,true,false,true,false,true,false,true,true,true,false,true,true,true],[false,false,true,false,true,false,true,false,false,false,false,false,true,false,false],[true,true,true,false,true,true,true,false,true,true,true,false,true,true,true],[true,false,false,false,false,false,false,false,true,false,true,true,false,false,true],[true,true,true,true,true,true,true,true,true,false,false,true,true,true,true]]];

    carSpawnCell;

    constructor(numberOfCellsAcross) {
        this.numberOfCellsAcross = numberOfCellsAcross;
        this.cellSize = this.determineCellSize();
        this.numberOfCellsDown = this.determineNumberOfCellsDown();
        this.generateCells();
        this.carSpawnCell = this.cells[0][0];
    }

    determineCellSize() {
        return (width - 2 * this.padding) / this.numberOfCellsAcross;
    }

    determineNumberOfCellsDown() {
        return floor((height - 2 * this.padding) / this.cellSize);
    }

    generateCells() {
        for(let j = 0; j < this.numberOfCellsDown; j++) {
            let row = [];
            for(let i = 0; i < this.numberOfCellsAcross; i++) {
                let topLeft;

                if(j == 0 && i == 0) {
                    row.push(new Cell(this.cellSize, createVector(this.padding, this.padding)));
                    continue;
                } else if(i == 0) {
                    let previousCell = this.cells[j-1][0];
                    topLeft = previousCell.bottomLeft;
                } else {
                    let previousCell = row[i-1];
                    topLeft = previousCell.topRight;
                }

                row.push(new Cell(this.cellSize, topLeft));
            }

            this.cells.push(row);        
        }
    }

    setCarSpawn() {
        for(let row of grid.cells) {
            for(let cell of row) {
                if(cell.contains(mouseX, mouseY)) {
                    this.carSpawnCell = cell;
                    break;
                }
            }
        }
    }

    toggleCellState() {
        for(let row of grid.cells) {
            for(let cell of row) {
                if(cell.contains(mouseX, mouseY)) {
                    if(!cell.hasChangedStateAlready) {
                        cell.toggleState();
                        this.updateTrack(cell);
                    }
                }
            }
        }
    }

    updateTrack(cell) {
        if(cell.isTrack) this.track.push(cell);
        else this.track = this.track.filter(trackCell => trackCell != cell);
    }

    resetCellsStateChangedAlready() {
        for(let row of this.cells) {
            for(let cell of row) {
                cell.resetStateChangedAlready();
            }
        }
    }

    saveCurrentTrack() {
        let isFull = this.savedTracks.length == this.maxSavedTracks;
        if(isFull) return;

        let track = [];

        for(let row of this.cells) {
            let newRow = [];
            for(let cell of row) {
                newRow.push(cell.isTrack);
            }
            track.push(newRow);
        }

        this.savedTracks.push(track);
    }

    loadSavedTrack(trackNumber) {
        let track = this.savedTracks[trackNumber - 1];

        if(track == null) {
            this.clearTrack();
            return;
        }
        if((trackNumber == 1 || trackNumber == 2) && (this.numberOfCellsAcross < 15 || this.numberOfCellsDown < 7)) {
            console.log("Grid too small for selected course.");
            return;
        }

        this.track = [];

        for(let j = 0; j < track.length; j++) {
            let row = track[j];
            for(let i = 0; i < row.length; i++) {
                let isTrack = track[j][i];
                this.cells[j][i].isTrack = isTrack;
                this.track.push(this.cells[j][i]);
            }
        }
        this.determineTrackEdges();
    }

    clearTrack() {
        for(let trackCell of this.track) {
            trackCell.isTrack = false;
        }

        this.track = [];
        this.trackEdges = [];
    }

    determineTrackEdges() {
        this.trackEdges = [];
        for(let j = 0; j < this.numberOfCellsDown; j++) {
            for(let i = 0; i < this.numberOfCellsAcross; i++) {
                let cell = this.cells[j][i];
                if(cell.isTrack) {
                    if(j == 0 || !this.cells[j-1][i].isTrack) { this.trackEdges.push(new Edge(cell.topLeft, cell.topRight)) } // above
                    if(j == this.numberOfCellsDown - 1 || !this.cells[j+1][i].isTrack) { this.trackEdges.push(new Edge(cell.bottomLeft, cell.bottomRight)) } // below
                    if(i == 0 || !this.cells[j][i-1].isTrack) { this.trackEdges.push(new Edge(cell.topLeft, cell.bottomLeft)) } // left
                    if(i == this.numberOfCellsAcross - 1 || !this.cells[j][i+1].isTrack) { this.trackEdges.push(new Edge(cell.topRight, cell.bottomRight)) } // right
                }
            }
        }
    }

    show(editingGrid) {
        if(editingGrid) {
            for(let row of this.cells)
                for(let cell of row)
                    cell.show(true);
        } else {
            for(let trackCell of this.track)
                trackCell.show();
        }

        for(let edge of this.trackEdges)
            edge.show();
    }
}