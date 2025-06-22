// クイズ問題データ（GitHub用）
const quizData = [
  {
    title: "穏やかな朝",
    audio: "audio_sample/穏やかな朝.mp3",
  },
  {
    title: "2:23AM",
    audio: "audio_sample/2_23_AM.mp3",
  },
  {
    title: "Morning",
    audio: "audio_sample/Morning.mp3",
  },
  {
    title: "Scary Shaper",
    audio: "audio_sample/Scary_Shaper.mp3",
  },
  {
    title: "君に花",
    audio: "audio_sample/君に花.mp3",
  },
];

// // クイズ問題データ（ローカル用）
// const quizData = [
//   {
//     title: "CENTER OF UNIVERSE",
//     audio: "audio/Q/01 CENTER OF UNIVERSE.m4a",
//   },
//   {
//     title: "その向こうへ行こう",
//     audio: "audio/Q/02 その向こうへ行こう.m4a",
//   },
//   {
//     title: "NOT FOUND",
//     audio: "audio/Q/03 NOT FOUND.m4a",
//   },
//   {
//     title: "スロースターター",
//     audio: "audio/Q/04 スロースターター.m4a",
//   },
//   {
//     title: "Surrender",
//     audio: "audio/Q/05 Surrender.m4a",
//   },
// ];

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
    // console.log("getCurrentQuestion() called");
    console.log("currentIndex:", this.currentIndex);
    return this.questions[this.currentIndex];
  }

  // 回答をチェック
  checkAnswer(answer) {
    console.log("checkAnswer() called");
    // 前後の空白を削除、英字は小文字に変換
    const correct = this.getCurrentQuestion().title.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();
    // console.log("Correct answer:", correct);
    // console.log("User answer:", userAnswer);
    return correct === userAnswer;
  }

  // 次の問題へ進む
  nextQuestion() {
    console.log("nextQuestion() called");
    this.currentIndex++;
  }

  // 最終問題かどうかをチェック
  isLastQuestion() {
    console.log("isLastQuestion() called");
    return this.currentIndex >= this.questions.length;
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
  $("#audio").attr("src", question.audio); // attribute（属性）を設定
  $("#answerInput").val("");
  $("#result").text("");
  $("#submitBtn").prop("disabled", true); // 初期状態ではボタンを無効化
}

// 回答ボタンのイベント
function setupAnswerHandler() {
  console.log("setupAnswerHandler() called");
  $("#submitBtn")
    .off("click") // 既存のイベントハンドラを解除
    .on("click", function () {
      const userInput = $("#answerInput").val();
      console.log("User input:", userInput);
      if (quiz.checkAnswer(userInput)) {
        quiz.score++;
        $("#result").text("正解！");
      } else {
        $("#result").text(
          `不正解… 正解は「${quiz.getCurrentQuestion().title}」`
        );
      }
      // 次の問題へ
      setTimeout(function () {
        quiz.nextQuestion();
        if (quiz.isLastQuestion()) {
          $("#quiz-container").html(
            `<h2>クイズ終了！</h2><p>スコア：${quiz.score}/${quiz.questions.length}</p>`
          );
        } else {
          renderQuestion();
          setupAnswerHandler(); // 次の問題の回答ハンドラを再設定
        }
      }, 3000); // 3秒後に次の問題へ進む
    });
}

// Enterキーで回答を送信できるようにする
function setupEnterKey() {
  $("#answerInput")
    .off("keydown")
    .on("keydown", function (e) {
      if (e.key === "Enter") {
        $("#submitBtn").click();
      }
    });
}

// 入力欄が空白の場合は回答ボタンを無効化
function setupInputWatcher() {
  $("#answerInput")
    .off("input")
    .on("input", function () {
      // thisは(#answerInput)
      if ($(this).val().trim()) {
        $("#submitBtn").prop("disabled", false);
      } else {
        $("#submitBtn").prop("disabled", true);
      }
    });
}

// 初期設定
$(function () {
  renderQuestion();
  setupAnswerHandler();
  setupEnterKey();
  setupInputWatcher();
});
