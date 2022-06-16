/*
Data and machine learning for artistic practice
Week 8

Stateful generation CharRNN


Instructions 
- upload any image
- click on the image classifier button
- once a result generates click on next to switch scene

- click on start to view the generating text
- click on pause to pause it
- press T to change the temperature 
- press S to enable text to speech
- click on single to only input a single character 
- click on reset to reset the text
- click on prev to go to the previous scene 
- click on up to scroll up 
- click on down to scroll down
*/

//model related variables
let charRNN,
  generating = false,
  generated_text = "";

let mgr, //loads scenemanager
  font, //loads font
  sceneNum, //selects the screen being displayed
  temp, //normaises mouseX and links it to temp
  applyTemp, //applies temp
  start_pause, //starts / pauses
  modelNum, //selects the model being used
  scroll, //scroll
  speech; //text to speech

//displays the name of the model being used
let modelName = [
  "bolano",
  "charlotte_bonte",
  "darwin",
  "dubois",
  "hemingway",
  "shakespeare",
  "woolf",
];

//image classifier variables
let classifier,
  result_string = "Predicting...",
  img,
  classifyBtn;

function preload() {
  classifier = ml5.imageClassifier("MobileNet"); //preloads classifier
  font = loadFont("PressStart2P-Regular.ttf"); //loads font
}

function setup() {
  textFont(font); //applies font to text
  sceneNum = 1; //displays scene one
  modelNum = int(random(0, 6)); //selects a random model

  //this is the scene manager it allows the user to select different scenes (uses scenemanager.js library)
  mgr = new SceneManager();
  mgr.addScene(SceneOne);
  mgr.addScene(SceneTwo);
  mgr.showNextScene();
}

function draw() {
  mgr.draw();
  if (sceneNum == 1) mgr.showScene(SceneOne); //loads scene one if sceneNum equals 1
  if (sceneNum == 2) mgr.showScene(SceneTwo); //loads scene two if sceneNum equals 2
}

function SceneOne() {
  this.setup = function () {
    createCanvas(800, 500);
    selectFile = createFileInput(handleFile); //creates a button that allows the user to upload an image
    selectFile.position(55, 410); //changes the position of the button
  };

  this.draw = function () {
    background(0);
    UI(sceneNum); //draws the UI for scene one
  };
}

function SceneTwo() {
  this.setup = function () {
    createCanvas(800, 500);

    // Create the LSTM Generator passing it the model directory
    if (modelNum == 0) charRNN = ml5.charRNN("./models/bolano/", modelReady); //uses bolano
    if (modelNum == 1) charRNN = ml5.charRNN("./models/charlotte_bronte/", modelReady); //uses charlotte bronte
    if (modelNum == 2) charRNN = ml5.charRNN("./models/darwin/", modelReady); //uses darwin
    if (modelNum == 3) charRNN = ml5.charRNN("./models/dubois/", modelReady); //uses dubois
    if (modelNum == 4) charRNN = ml5.charRNN("./models/shakespeare/", modelReady); //uses shakespeare
    if (modelNum == 5) charRNN = ml5.charRNN("./models/woolf/", modelReady); //uses woolf

    applyTemp = 0.5; //default value for the applied temperature
    start_pause = -1; //begins when the user clicks the start button
    scroll = 0; //allows scrolling up and down
      
    //enables text to speech
    speech = new p5.Speech();
    speech.started();
  };

  this.draw = function () {
    background(0);
    if (start_pause == 0) generate(); //generates when user clicks start
    if (start_pause == 1) generating = false; //stops generating when user clicks pause
    UI(sceneNum); //draws scene two UI
  };
}

function keyPressed() {
  switch (key) {
    case "t": //applies temperature when user presses t
      applyTemp = temp;
      break;
          
    case "s": //enables text to speech
      speech.setVoice("SpeechSynthesisVoice");
      speech.speak(generated_text);
      break;
  }
}

function UI(num) {
  fill(255);
  cursor(ARROW); //makes sure the cursor is an arrow when not on a button

  //everything within this if statment draws the UI for scene one
  if (num === 1) {
    let x = 20, //upload image x position
      x2 = 180, //classify image button x position
      x3 = 450, // next button x position
      y = height - 70, //y posiiton
      btn_Width = 140, //upload width
      btn2_Width = 250, //classify width
      btn3_Width = 60, //next width
      btnHeight = 50; //button height

    //displays X & Y position
    text("X: " + mouseX, 10, 20);
    text("Y: " + int(mouseY), 10, 40);
    text("Model: " + modelName[modelNum], 10, 60);

    selectFile.show(); //shows the choose file button

    push();
    //onscreen instructions
    textSize(16);
    text("First, Upload an image (click on choose file)", 20, height / 3);
    text("Next, click on 'Classify Uploaded Image' ", 20, height / 3 + 30);
    text("Once done click on next ", 20, height / 3 + 60);
    text(result_string, 20, height / 3 + 90);

    //buttons
    fill(255);
    rect(x, y, btn_Width, btnHeight);
    rect(x2, y, btn2_Width, btnHeight);
    rect(x3, y, btn3_Width, btnHeight);

    //button text
    fill(0);
    textSize(10);
    text("Upload Image", x + 10, height - 40);
    text("Classify Uploaded Image", x2 + 10, height - 40);
    text("Next", x3 + 10, height - 40);

    pop();

    //checks if the mouse is over classify button
    if (
      mouseX >= x2 &&
      mouseX <= x2 + btn2_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x2, y, btn2_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        classifyImg();
      };
    } else if (
      //checks if the mouse is above the next button
      mouseX >= x3 &&
      mouseX <= x3 + btn3_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x3, y, btn3_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        sceneNum = 2;
      };
    } else {
      cursor(ARROW);
    }
  }

  //everything within this if statment draws the UI for scene two
  if (num === 2) {
    let x = 20, //position for the start button
      x2 = 110, //position for the temperature instructions
      x3 = 430, //position for the single button
      x4 = 530, //position for the reset button
      x5 = 627, //position for the prev button
      x6 = 717, //position for the up & down buttons
      y = height - 70, //button y position
      y2 = height - 40, //down button y position
      btn_Width = 70, //start width
      btn2_Width = 300, //temp width
      btn3_Width = 77, //single width
      btn4_Width = 70, //reset width
      btn5_Width = 60, //prev width
      btn6_Width = 60, //up and down width
      btnHeight = 50, //button height
      btnHeight2 = 20, //up and down button height
      display = false;

    start_pause = start_pause % 2; //switched between start and pause

    push(); //implements scroling on the y axis
    translate(0, scroll);
    text(generated_text, 10, 70, width, height);
    pop();

    selectFile.hide(); //hides the choose file button
    temp = norm(mouseX, 0, width); //normalises mouseX
    if (temp > 1) temp = 1; //temp = 1 when mouse is over the right of the canvas
    if (temp < 0) temp = 0; //temp = 0 when mouse is over the left of the canvas

    //used to block scrolling text from overlaying the buttons text at the top
    fill(0);
    rect(0, 0, width, 55);
    rect(0, 415, width, 85);

    fill(255);
    noStroke(0);
    textSize(10);
    text("Seed Text: " + result_string, 10, 10, width, height);
    text("Temperature: " + temp, 10, 30, width, height);
    text("Temperature Selected: " + applyTemp, 250, 30, width, height);

    //draws the buttons
    push();
    fill(255);
    rect(x, y, btn_Width, btnHeight);
    rect(x2, y, btn2_Width, btnHeight);
    rect(x3, y, btn3_Width, btnHeight);
    rect(x4, y, btn4_Width, btnHeight);
    rect(x5, y, btn5_Width, btnHeight);

    rect(x6, y, btn6_Width, btnHeight2);
    rect(x6, y2, btn6_Width, btnHeight2);
    fill(0);
    textSize(10);

    //switches the text of the start/pause button
    if (!generating) text("Start", x + 10, height - 40);
    if (generating) text("Pause", x + 10, height - 40);

    //button text
    text("Press T to apply temperature", x2 + 10, height - 50);
    text("Press S for text to speech", x2 + 10, height - 30);
    text("Single", x3 + 10, height - 40);
    text("Reset", x4 + 10, height - 40);
    text("Prev", x5 + 10, height - 40);
    text(" up ", x6 + 10, height - 55);
    text("down", x6 + 10, height - 25);
    pop();

    //checks if the mouse is over the start button
    if (
      mouseX >= x &&
      mouseX <= x + btn_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x, y, btn_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        start_pause += 1;
      };
    } else if (
      //checks if the mouse is over the single button
      mouseX >= x3 &&
      mouseX <= x3 + btn3_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x3, y, btn3_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        predict();
      };
    } else if (
      //checks if the mouse is over the reset button
      mouseX >= x4 &&
      mouseX <= x4 + btn4_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x4, y, btn4_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        scroll = 0;
        resetModel();
      };
    } else if (
      //checks if the mouse is over the prev button
      mouseX >= x5 &&
      mouseX <= x5 + btn5_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x5, y, btn5_Width, btnHeight);
      cursor(HAND);
      pop();

      this.mousePressed = function () {
        sceneNum = 1;
      };
    } else if (
      //checks if the mouse is over the up button
      mouseX >= x6 &&
      mouseX <= x6 + btn6_Width &&
      mouseY >= y &&
      mouseY <= y + btnHeight2
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x6, y, btn6_Width, btnHeight2);
      cursor(HAND);
      pop();

      if (mouseIsPressed) scroll += 10;
    } else if (
      //checks if the mouse is over the down button
      mouseX >= x6 &&
      mouseX <= x6 + btn6_Width &&
      mouseY >= y2 &&
      mouseY <= y2 + btnHeight2
    ) {
      push(); //draws a red border around the button
      stroke(255, 0, 0);
      strokeWeight(5);
      fill(255, 0);
      rect(x6, y2, btn6_Width, btnHeight2);
      cursor(HAND);
      pop();

      if (mouseIsPressed) scroll -= 10;
    } else {
      cursor(ARROW);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, canvasHeight);
}

async function modelReady() {
  console.log("model ready")
  resetModel();
}

function resetModel() {
  charRNN.reset();
  const seed = result_string;
  charRNN.feed(seed);
  generated_text = seed;
}

function generate() {
  if (generating && start_pause == 1) {
    generating = false;
    //startBtn.html('Start');
  } else if (!generating && start_pause == 0) {
    generating = true;
    //startBtn.html('Pause');
    loopRNN();
  }
}

async function loopRNN() {
  while (generating) {
    await predict();
  }
}

async function predict() {
  let temperature = applyTemp;
  let next = await charRNN.predict(temperature);
  await charRNN.feed(next.sample);
  generated_text += next.sample;
}

function handleFile(file) {
  print(file);
  if (file.type === "image") {
    img = createImg(file.data, "");
    img.hide();
  } else {
    img = null;
  }
}

function weKnow(error, results) {
  if (!error) {
    // form a string to contain the results
    // here we use the backtick method of embedding variables in strings. We use Math.ceil to round up the decimal to the closest whole number
    result_string = `This is a ${results[0].label}, I'm ${Math.ceil(
      results[0].confidence * 100
    )}% confident.`;
    console.log(result_string);
  } else {
    // there was an error
    console.log(
      "There was an error determining the object within the image -> " + error
    );
  }
}

function classifyImg() {
  classifier.classify(img, weKnow);
}
