let video;
let handpose;
let predictions = [];

let leftPlayer, rightPlayer;

let items = [];

let score = 5;
let gameRunning = true;
let questionActive = false;

let questionDiv; // 題目區域
let buttons = [];

let eduQuestions = [
  {
    q: "教育科技學系主要研究什麼？",
    a: "教學與科技",
    options: ["教學與科技", "金融管理", "醫學研究", "環境保護"]
  },
  {
    q: "虛擬實境在教育中常用來做什麼？",
    a: "模擬環境",
    options: ["模擬環境", "數據分析", "語言學習", "行政管理"]
  },
  {
    q: "自適應學習系統能幫助什麼？",
    a: "個別化學習",
    options: ["個別化學習", "大量記憶", "快速測驗", "隨機教學"]
  },
  {
    q: "翻轉教室是什麼教學方式？",
    a: "先學習再討論",
    options: ["先學習再討論", "老師上課，學生聽", "全班同時考試", "團隊合作"]
  },
  {
    q: "教育大數據主要用來分析什麼？",
    a: "學習行為",
    options: ["學習行為", "環境汙染", "金融趨勢", "運動成績"]
  }
];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, () => console.log("Handpose loaded"));
  handpose.on("predict", results => predictions = results);

  leftPlayer = new Player(50, height / 2, color(255, 100, 100));
  rightPlayer = new Player(width - 50, height / 2, color(100, 100, 255));

  questionDiv = createDiv("").style('position', 'absolute').style('top', '10px').style('right', '10px').style('width', '280px').style('background', 'rgba(255,255,255,0.9)').style('padding', '15px').style('border-radius', '10px').hide();
}

function draw() {
  background(30);

  // 鏡像反轉
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (!gameRunning) {
    fill(255);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("遊戲結束！得分：" + score, width / 2, height / 2);
    return;
  }

  if (!questionActive) {
    updatePlayers();
    spawnItems();
    updateItems();
  }

  drawPlayers();
  drawItems();

  drawHUD();
}

function updatePlayers() {
  if (predictions.length > 0) {
    let hands = predictions;

    let leftHand = null;
    let rightHand = null;

    hands.forEach(hand => {
      let x = hand.landmarks[0][0];
      if (x < width / 2) leftHand = hand;
      else rightHand = hand;
    });

    if (leftHand) {
      let x = width - leftHand.landmarks[0][0];
      let y = leftHand.landmarks[0][1];
      leftPlayer.setPos(x, y);
    }
    if (rightHand) {
      let x = width - rightHand.landmarks[0][0];
      let y = rightHand.landmarks[0][1];
      rightPlayer.setPos(x, y);
    }
  }
}

function spawnItems() {
  if (frameCount % 60 === 0) {
    let r = random();
    if (r < 0.6) {
      let q = random(eduQuestions);
      items.push(new RewardBox(random(50, width - 50), -40, q));
    } else {
      items.push(new Bomb(random(50, width - 50), -40));
    }
  }
}

function updateItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].update();

    if (items[i].checkCollision(leftPlayer) || items[i].checkCollision(rightPlayer)) {
      if (items[i] instanceof RewardBox) {
        questionActive = true;
        noLoop();
        showQuestion(items[i].question);
        items.splice(i, 1);
        return;
      } else if (items[i] instanceof Bomb) {
        score -= 5;
        items.splice(i, 1);
        alert("碰到炸彈！扣5分！");
      }
    } else if (items[i].y > height + 50) {
      items.splice(i, 1);
    }
  }
}

function drawPlayers() {
  leftPlayer.display();
  rightPlayer.display();
}

function drawItems() {
  for (let item of items) {
    item.display();
  }
}

function drawHUD() {
  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text("得分: " + score, 10, 10);
  if(score >= 20){
    gameRunning = false;
  } else if(score <= 0){
    gameRunning = false;
  }
}

function showQuestion(question) {
  questionDiv.html("");
  questionDiv.show();

  let qText = createP(question.q);
  qText.parent(questionDiv);
  qText.style('font-weight', 'bold').style('font-size', '16px').style('margin', '5px 0');

  buttons = [];
  for(let option of question.options){
    let btn = createButton(option);
    btn.parent(questionDiv);
    btn.style('display', 'block');
    btn.style('margin', '5px 0');
    btn.mousePressed(() => {
      checkAnswer(option, question.a);
    });
    buttons.push(btn);
  }
}

function checkAnswer(selected, correct) {
  questionDiv.hide();
  questionActive = false;

  if(selected === correct){
    alert("答對了！得10分！");
    score += 10;
  } else {
    alert("答錯了！扣5分！正確答案是：" + correct);
    score -= 5;
  }

  loop();
}

// 玩家方塊
class Player {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.size = 60;
    this.color = c;
  }
  setPos(x, y) {
    this.x = constrain(x, this.size / 2, width - this.size / 2);
    this.y = constrain(y, this.size / 2, height - this.size / 2);
  }
  display() {
    push();
    noStroke();
    fill(this.color);
    rectMode(CENTER);
    rect(this.x, this.y, this.size, this.size);
    pop();
  }
}

// 獎勵盒(帶問題)
class RewardBox {
  constructor(x, y, question) {
    this.x = x;
    this.y = y;
    this.size = 70;
    this.question = question;
    this.speed = 3;
    this.color = color(255, 192, 203);
  }
  update() {
    this.y += this.speed;
  }
  display() {
    push();
    rectMode(CENTER);
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.size, this.size, 10);
    fill(0);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("問題", this.x, this.y);
    pop();
  }
  checkCollision(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < (this.size / 2 + player.size / 2) * 0.8;
  }
}

// 炸彈
class Bomb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.speed = 5;
    this.color = color(80, 80, 80);
  }
  update() {
    this.y += this.speed;
  }
   display() {
    push();
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size);
    pop();
  }
  checkCollision(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < (this.size / 2 + player.size / 2) * 0.8;
  }
}
