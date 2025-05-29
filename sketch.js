let handPose;
let video;
let hands = [];
let pts = []; 
let heartColor = 255;
let hearts = []; 
let heartCreated = false;

let colorPalette = ["#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose = ml5.handpose(video, modelReady);  // 載入 handpose 模型
  handPose.on("predict", gotHands);            // 註冊 callback 接收辨識結果
}

function modelReady() {
  console.log("Handpose model loaded.");
}

function draw() {
  image(video, 0, 0, width, height);

  trackHandPosition();

  fill(heartColor);
  noStroke();
  beginShape();
  for (let i = 0; i < pts.length; i++) {
    if (pts[i]) {
      vertex(pts[i].x, pts[i].y);
    }
  }
  endShape(CLOSE);

  checkForHeart();

  // 更新與顯示愛心動畫
  for (let i = hearts.length - 1; i >= 0; i--) {
    hearts[i].update();
    hearts[i].display();
    if (hearts[i].done) {
      hearts.splice(i, 1);
    }
  }
}

function gotHands(results) {
  hands = results;
}

function trackHandPosition() {
  let updatedPts = [];
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let handedness = hand.handedness;
    let keypoints = hand.landmarks.map((p, index) => ({ x: p[0], y: p[1], z: p[2] }));

    if (handedness === "Left") {
      updatedPts[0] = keypoints[4];
      updatedPts[1] = keypoints[3];
      updatedPts[2] = keypoints[2];
      updatedPts[3] = keypoints[5];
      updatedPts[4] = keypoints[6];
      updatedPts[5] = keypoints[7];
      updatedPts[6] = keypoints[8];
    }

    if (handedness === "Right") {
      updatedPts[7] = keypoints[8];
      updatedPts[8] = keypoints[7];
      updatedPts[9] = keypoints[6];
      updatedPts[10] = keypoints[5];
      updatedPts[11] = keypoints[2];
      updatedPts[12] = keypoints[3];
      updatedPts[13] = keypoints[4];
    }
  }
  pts = updatedPts;
}

function checkForHeart() {
  let leftThumb = pts[0];
  let rightThumb = pts[13];
  let leftIndex = pts[6];
  let rightIndex = pts[7];

  if (leftThumb && rightThumb && leftIndex && rightIndex) {
    let thumbDist = dist(leftThumb.x, leftThumb.y, rightThumb.x, rightThumb.y);
    let indexDist = dist(leftIndex.x, leftIndex.y, rightIndex.x, rightIndex.y);

    if (thumbDist < 20 && indexDist < 20 && !heartCreated) {
      hearts.push(new Heart(pts));
      heartCreated = true;
    } else if (thumbDist > 30 || indexDist > 30) {
      heartCreated = false;
    }
  }
}

class Heart {
  constructor(points) {
    this.points = points.map(p => ({ x: p.x, y: p.y }));
    this.color = random(colorPalette);
    this.opacity = 255;
    this.done = false;
  }

  update() {
    this.opacity -= 3;
    if (this.opacity <= 0) {
      this.done = true;
    }
  }

  display() {
    fill(this.color + hex(floor(this.opacity), 2));
    noStroke();
    beginShape();
    for (let pt of this.points) {
      vertex(pt.x, pt.y);
    }
    endShape(CLOSE);
  }
}
