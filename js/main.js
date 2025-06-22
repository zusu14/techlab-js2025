// クイズ問題データ
const quizData = [
  {
    title: "穏やかな朝",
    audio: "audio/穏やかな朝.mp3",
  },
  {
    title: "2:23AM",
    audio: "audio/2_23_AM.mp3",
  },
  {
    title: "Morning",
    audio: "audio/Morning.mp3",
  },
  {
    title: "Scary Shaper",
    audio: "audio/Scary_Shaper.mp3",
  },
  {
    title: "君に花",
    audio: "audio/君に花.mp3",
  },
];

// Questionクラス
class Question {
  constructor({ title, audio }) {
    this.title = title;
    this.audio = audio;
  }
}

// Questionクラスのインスタンス生成（配列マッピング処理）
const questions = quizData.map((q) => new Question(q));
console.log(questions);

// Quizクラス
class Quiz {
  constructor(questions) {
    this.questions = questions;
    this.currentIndex = 0;
    this.score = 0;
  }

  // 出題する問題を取得
  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }
}

// Quizインスタンス生成
const quiz = new Quiz(questions);

// 問題を表示する関数
function renderQuestion() {
  console.log("renderQuestion() called");
  const question = quiz.getCurrentQuestion();
  // HTML要素に設定
  $("#question-number").text(`第${quiz.currentIndex + 1}問`);
  $("#audio").attr("src", question.audio);
  $("#answerInput").val("");
  $("#result").text("");
}

// 初期表示
$(function () {
  renderQuestion();
});
