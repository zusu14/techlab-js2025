// Firestoreの関数うをwindowオブジェクトから取得
const db = window.db;
const {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} = window.firestoreFns;

$(document).ready(function () {
  // クイズ進行用の状態グローバル変数
  let timer = null; // カウントダウン制御用
  let currentQuestionIndex = 0; // 出題データ選択用インデックス
  let correctCount = 0; // 正解数カウント変数
  let totalQuestions = 2; // 出題数
  let questionCount = 0; // 今何問目か
  let usedIndexes = []; // 出題済みのインデックス
  let isComposing = false;
  let playTimeDuration = 2000; // イントロ再生時間（ミリ秒）

  // UI初期化
  function resetUI() {
    $("#startButton").show().text("クイズを始める").prop("disabled", false);
    $("#questionNumber").empty();
    $("#countdown").empty();
    $("#quizArea").empty();
    $("#message").empty();
    $("#restartButton").hide();
  }

  // カウントダウン表示
  function showCountdown(count, callback) {
    $("#countdown").text(count);
    timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        $("#countdown").text("イントロ再生中");
        callback();
      } else {
        $("#countdown").text(count);
      }
    }, 1000);
  }

  // 未出題のデータからランダムにインデックス取得
  function getRandomQuestionIndex() {
    const availableIndexes = quizData
      .map((_, i) => i) // マッピングでインデックスのみを取得する
      .filter((i) => !usedIndexes.includes(i)); // 出題済みのインデックスを除外
    if (availableIndexes.length === 0) return null; // 全て出題済みの場合はnullを返す
    return availableIndexes[
      Math.floor(Math.random() * availableIndexes.length)
    ];
  }

  // イントロ再生
  function playIntro(callback) {
    currentQuestionIndex = getRandomQuestionIndex();
    if (currentQuestionIndex === null) return; // 全て出題済みの場合は終了
    usedIndexes.push(currentQuestionIndex);

    const audio = document.getElementById("introAudio"); // Audio要素はネイティブ
    audio.src = quizData[currentQuestionIndex].audio;
    audio.currentTime = 0; // 再生位置を先頭に戻す
    audio.play();

    // 指定秒再生後、クイズ出題
    setTimeout(() => {
      audio.pause();
      $("#countdown").hide();
      callback();
    }, playTimeDuration);
  }

  // 問題表示
  function showQuiz() {
    const correctTitle = quizData[currentQuestionIndex].title;
    $("#quizArea").empty(); // 問題エリアをクリア
    const questionElem = $("<h3>").text("この曲のタイトルは？");
    const inputElem = $(
      '<input type="text" id="answerInput" placeholder="曲名を入力">'
    );
    const submitBtn = $('<button id="submitBtn">回答する</button>');
    // 問題文と入力欄、ボタンを追加
    $("#quizArea").append(questionElem, inputElem, submitBtn);

    // 回答ボタン押下時
    $("#submitBtn")
      .off("click")
      .on("click", () => {
        handleAnswer(correctTitle); // 回答処理
      });

    // エンターキー対応（日本語入力考慮）
    $("#answerInput")
      .off("compositionstart compositionend keydown")
      .on("compositionstart", function () {
        isComposing = true;
      })
      .on("compositionend", function () {
        isComposing = false;
      })
      .on("keydown", function (e) {
        if (e.key === "Enter" && !isComposing) {
          $("#submitBtn").click();
        }
      });
  }

  // 回答処理
  function handleAnswer(correctTitle) {
    const userAnswer = $("#answerInput").val().trim();
    // 空欄チェック
    if (!userAnswer) {
      $("#message").text("回答を入力してください。");
      return;
    }
    if (userAnswer === correctTitle) {
      $("#message").text("正解です！");
      correctCount++;
    } else {
      $("#message").text("残念、不正解！");
    }
    // 正解タイトルとCDジャケット画像を表示ß
    $("#message").append("<br>「" + correctTitle + "」");
    $("#message").append(
      "<br><img src='" +
        quizData[currentQuestionIndex].img +
        "' alt='CDジャケット'>"
    );
    // ボタンと入力欄を無効化
    $("#submitBtn").prop("disabled", true);
    $("#answerInput").prop("disabled", true);

    // 回答後に楽曲を再生し、次の問題または終了
    playAnswerAudio();
  }

  // 回答後の楽曲再生と次の問題遷移
  function playAnswerAudio() {
    const audio = document.getElementById("introAudio");
    audio.currentTime = 0; // 再生位置を先頭に戻す
    audio.play();
    setTimeout(async function () {
      // Firestoreにスコアを保存するためasyncに変更
      audio.pause();
      questionCount++;
      if (questionCount >= totalQuestions) {
        // 全問終了
        $("#message").append(
          "<br>全" + totalQuestions + "問中、" + correctCount + "問正解でした！"
        );
        $("#restartButton").show();
        // スコアをFirestoreに保存(仮）)
        const username = prompt("あなたの名前を入力してください:");
        if (username) await saveScoreToFirestore(username, correctCount); // awaitで非同期処理を待つ
        // ここでランキング取得・表示も可能
      } else {
        // 自動で次の問題へ
        $("#questionNumber")
          .text("第" + (questionCount + 1) + "問")
          .show();
        $("#countdown").show();
        $("#quizArea").empty();
        $("#message").empty();
        showCountdown(3, () => playIntro(showQuiz));
      }
    }, 7000);
  }

  // Firestoreにスコア保存
  async function saveScoreToFirestore(username, score) {
    await addDoc(collection(db, "scores"), {
      name: username,
      score: score,
      date: serverTimestamp(),
    });
  }

  // もう一度遊ぶ
  $("#restartButton").on("click", () => {
    location.reload();
  });

  // スタートボタン押下時
  $("#startButton")
    .off("click")
    .on("click", function () {
      if (timer) return;
      if (questionCount >= totalQuestions) return;
      $("#startButton").hide();
      $("#questionNumber")
        .text("第" + (questionCount + 1) + "問")
        .show();
      $("#countdown").show();
      $("#quizArea").empty();
      $("#message").empty();
      showCountdown(3, () => playIntro(showQuiz));
    });

  // 初期化
  resetUI();
});
