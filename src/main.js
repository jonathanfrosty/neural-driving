let grid;
const gridSquaresAcross = 15;

let car;
const maxSpeed = 7;
const turningAbility = 1.3;
const carLaserCount = 31;
const minCarLaserLength = 20;
const maxCarLaserLength = 400;

let lasersVisible = false;

let trainingData = [];
let newTrainingData = [];

let approximateTrainingTimeElapsed = 0;

let neuralNet = null;
let beginTrainingNeuralNet = false;
let trainingNeuralNet = false;

let gridEditingMode = true;
let setSpawnMode = false;
let trainingMode = false;
let neuralNetMode = false;

let modeP;
let modeText = 'Grid Editing';
let keyP;
let keyText =
  'Edit Grid: G | Set Spawn: S | Respawn: SPACE | Training Mode: T | Run Neural Net: N | Toggle Lasers: L | Save Course: ENTER (max 5) | Load Course: 1-5 | Clear Course: ESC';

function setup() {
  createCanvas(windowWidth, windowHeight);
  grid = new Grid(gridSquaresAcross);
  respawn();
  newTrainingData = defaultTrainingData;

  modeP = createP()
    .position(30, 5)
    .html('Mode: ' + modeText);
  keyP = createP()
    .position(30, height - 25)
    .html(keyText);
}

function draw() {
  background(10);

  grid.show(gridEditingMode);

  if (!gridEditingMode) {
    if (!car.crashed) {
      if (neuralNetMode) applyNeuralNet();
      else applyManualMovement();
      car.update();

      if (trainingMode) {
        if (approximateTrainingTimeElapsed == 0) console.log('started training mode...');
        else if (approximateTrainingTimeElapsed % 1800 == 0) {
          console.log(
            approximateTrainingTimeElapsed / 60 +
              ' seconds elapsed (' +
              newTrainingData.length +
              ' training elements)'
          );
        }
        approximateTrainingTimeElapsed++;

        if (frameCount % 4 == 0) {
          if (car.isMoving()) updateTrainingData();
        }
      }
    } else if (neuralNetMode) {
      setTimeout(respawn, 500);
    }
  }

  car.show();

  if (gridEditingMode) {
    if (mouseIsPressed) {
      if (setSpawnMode) grid.setCarSpawn();
      else {
        grid.toggleCellState();
        grid.determineTrackEdges();
      }
    } else grid.resetCellsStateChangedAlready();
  }

  updateMode();
}

function respawn() {
  car = new Car(
    maxSpeed,
    turningAbility,
    carLaserCount,
    minCarLaserLength,
    maxCarLaserLength
  );
}

function updateMode() {
  if (gridEditingMode) modeText = 'Grid Editing';
  else modeText = 'Manual Steering';

  if (setSpawnMode) modeText = 'Setting Spawn';
  if (trainingMode) modeText = 'Collecting Training Data';
  if (neuralNetMode) modeText = 'Neural Net Steering';
  if (trainingNeuralNet) modeText = 'Training Neural Net';

  modeP.html('Mode: ' + modeText);
}

function keyPressed() {
  if (keyCode == ENTER) grid.saveCurrentTrack();
  if (keyCode == ESCAPE && gridEditingMode) grid.clearTrack();
  if (keyCode == 32) respawn(); // SPACE
  if (keyCode == 49 && gridEditingMode) grid.loadSavedTrack(1); // 1
  if (keyCode == 50 && gridEditingMode) grid.loadSavedTrack(2); // 2
  if (keyCode == 51 && gridEditingMode) grid.loadSavedTrack(3); // 3
  if (keyCode == 52 && gridEditingMode) grid.loadSavedTrack(4); // 4
  if (keyCode == 53 && gridEditingMode) grid.loadSavedTrack(5); // 5
  if (keyCode == 71) {
    // G
    gridEditingMode = !gridEditingMode;
    if (!gridEditingMode) setSpawnMode = false;
  }
  if (keyCode == 76) lasersVisible = !lasersVisible; // L
  if (keyCode == 83 && gridEditingMode) setSpawnMode = !setSpawnMode; // S
  if (keyCode == 84 && !trainingNeuralNet && !gridEditingMode) {
    // T
    trainingMode = !trainingMode;
    if (!trainingMode) {
      approximateTrainingTimeElapsed = 0;
      console.log('training mode stopped.');
      if (newTrainingData.length > 0) {
        trainingNeuralNet = true;
        setTimeout(trainNeuralNetwork, 100);
      }
    }
  }
  if (keyCode == 78 && neuralNet != null) {
    // N
    neuralNetMode = !neuralNetMode;
    if (neuralNetMode) console.log('running neural net...');
    else console.log('neural net stopped.');
  }
  if (keyCode == 78 && neuralNet == null) {
    console.log('No neural net has been trained yet.');
  }
}

function updateTrainingData() {
  let sensorDistances = car.neuralInputs;

  // moving backwards is ignored
  let isMovingForward = car.forward ? 1 : 0;
  let isMovingLeft = car.left ? 1 : 0;
  let isMovingRight = car.right ? 1 : 0;

  let data = {
    input: sensorDistances,
    output: [isMovingForward, isMovingLeft, isMovingRight]
  };

  newTrainingData.push(data);
}

let hiddenNodes = 60;
let errorThresh = 0.06;
let learningRate = 0.3;
let iterations = 1000;

function trainNeuralNetwork() {
  if (neuralNet == null) {
    const config = {
      hiddenLayers: [hiddenNodes, hiddenNodes], // two hidden layers
      activation: 'sigmoid'
    };

    neuralNet = new brain.NeuralNetwork(config);
  }

  console.log('training neural net...');

  trainingData = trainingData.concat(newTrainingData);
  newTrainingData = [];

  console.log('   ' + trainingData.length + ' training elements');

  let start = new Date().getTime();
  neuralNet.train(trainingData, {
    log: true,
    logPeriod: 10,
    errorThresh: errorThresh,
    learningRate: learningRate,
    iterations: iterations
  });
  let finish = new Date().getTime();

  let timeTaken = (finish - start) / 1000;
  console.log('trained in ' + timeTaken + ' seconds.');

  trainingNeuralNet = false;
}

function applyManualMovement() {
  car.forward = keyIsDown(UP_ARROW);
  car.backward = keyIsDown(DOWN_ARROW);
  car.left = keyIsDown(LEFT_ARROW);
  car.right = keyIsDown(RIGHT_ARROW);
}

function applyNeuralNet() {
  let inputs = car.neuralInputs;
  let outputs = neuralNet.run(inputs);

  // moving backwards is ignored, and more sensitive to turning left/right
  car.forward = random() < outputs[0];
  car.left = random(0.5) < outputs[1];
  car.right = random(0.5) < outputs[2];
}
