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
  let playTimeDuration = 3000; // イントロ再生時間（ミリ秒）
  let correctPlayTimeDuration = 7000; // 正解イントロ再生時間（ミリ秒）

  // UI初期化
  function resetUI() {
    $("#startButton").show().text("クイズを始める").prop("disabled", false);
    $("#questionNumber").empty();
    $("#countdown").empty();
    $("#quizArea").empty();
    $("#message").empty();
    $("#restartButton").hide();
    $("#showRankingAfterQuizBtn").hide();
    // $("#backToHomeFromQuiz").hide();
    // $("#backToHomeFromRanking").hide();
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
    // console.log("Available indexes:", availableIndexes);
    if (availableIndexes.length === 0) return null; // 全て出題済みの場合はnullを返す
    return availableIndexes[
      Math.floor(Math.random() * availableIndexes.length)
    ];
  }

  // イントロ再生
  function playIntro(callback) {
    // console.log("playIntro called");
    currentQuestionIndex = getRandomQuestionIndex();
    // console.log("Current question index:", currentQuestionIndex);
    if (currentQuestionIndex === null) return; // 全て出題済みの場合は終了
    usedIndexes.push(currentQuestionIndex);

    const audio = document.getElementById("introAudio"); // Audio要素はネイティブ
    audio.src = quizData[currentQuestionIndex].audio;
    audio.currentTime = 0; // 再生位置を先頭に戻す
    audio.play();

    // 指定秒再生後、クイズ出題
    setTimeout(() => {
      // console.log("イントロ再生終了");
      audio.pause();
      $("#countdown").hide();
      callback();
    }, playTimeDuration);
  }

  // 問題表示
  function showQuiz() {
    // console.log("showQuiz called");
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
        // console.log("Submit button clicked");
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
        // console.log("Key pressed:", e.key);
        if (e.key === "Enter" && !isComposing) {
          $("#submitBtn").click();
        }
      });
  }

  // 回答処理
  function handleAnswer(correctTitle) {
    // console.log("handleAnswer called");
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
    // console.log("playAnswerAudio called");
    const audio = document.getElementById("introAudio");
    audio.currentTime = 0; // 再生位置を先頭に戻す
    audio.play();
    // Firestoreにスコアを保存するためasyncに変更
    setTimeout(async function () {
      audio.pause();
      questionCount++;
      if (questionCount >= totalQuestions) {
        // 全問終了
        $("#message").append(
          "<br>全" + totalQuestions + "問中、" + correctCount + "問正解でした！"
        );
        // 名前入力欄と保存ボタンを追加
        $("#message").append(`
          <div id="scoreSaveArea" style="margin-top:16px;">
            <input type="text" id="usernameInput" placeholder="名前を入力" style="margin-right:8px;">
            <button id="saveScoreBtn">スコアを保存</button>
            <span id="saveScoreMsg" style="margin-left:8px;"></span>
          </div>
        `);
        $("#restartButton").show();
        $("#showRankingAfterQuizBtn").show();
        $("#backToHomeFromQuiz").show();

        // 保存ボタンのイベント
        $("#saveScoreBtn")
          .off("click")
          .on("click", async function () {
            const username = $("#usernameInput").val().trim();
            if (!username) {
              $("#saveScoreMsg")
                .css("color", "red")
                .text("名前を入力してください");
              return;
            }
            await saveScoreToFirestore(username, correctCount);
            $("#saveScoreMsg").text("保存しました！");
            $("#saveScoreBtn").prop("disabled", true);
            $("#usernameInput").prop("disabled", true);
          });

        // ボタンイベント
        $("#showRankingAfterQuizBtn")
          .off("click")
          .on("click", showRankingScreen);
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
    }, correctPlayTimeDuration);
  }

  // Firestoreにスコア保存
  async function saveScoreToFirestore(username, score) {
    // console.log("Saving score to Firestore:", username, score);
    await addDoc(collection(db, "scores"), {
      name: username,
      score: score,
      date: serverTimestamp(),
    });
  }

  // もう一度遊ぶ
  $("#restartButton").on("click", () => {
    // console.log("Restart button clicked");
    location.reload();
  });

  // スタートボタン押下時
  $("#startButton")
    .off("click")
    .on("click", function () {
      // console.log("Start button clicked");
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

  // ホーム画面表示
  function showHome() {
    // console.log("showHome called");
    $("#homeMenu").show();
    $("#quizContainer").hide();
    $("#rankingContainer").hide();

    // // 音源を停止
    // const audio = document.getElementById("introAudio");
    // if (audio) {
    //   console.log("音源を停止");
    //   audio.pause();
    //   audio.src = "";
    //   audio.reload(); // 音源をリセット
    //   audio.currentTime = 0;
    // }
  }

  // クイズ画面表示
  function showQuizScreen() {
    // console.log("showQuizScreen called");
    $("#homeMenu").hide();
    $("#quizContainer").show();
    $("#rankingContainer").hide();
    // クイズ初期化
    resetUI();
    // 最初の問題を出題
    $("#startButton").hide();
    $("#questionNumber").text("第1問").show();
    $("#countdown").show();
    showCountdown(3, () => playIntro(showQuiz));
  }

  // ランキング画面表示
  async function showRankingScreen() {
    // console.log("showRankingScreen called");
    $("#homeMenu").hide();
    $("#quizContainer").hide();
    $("#rankingContainer").show();
    // Firestoreからランキング取得
    const q = query(
      collection(db, "scores"),
      orderBy("score", "desc"), // スコアの降順
      limit(10) // 上位10件取得
    );
    const querySnapshot = await getDocs(q);
    let html = "<ol>";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore Timestampを日付文字列に変換
      let dateStr = "";
      if (data.date && data.date.toDate) {
        const d = data.date.toDate();
        dateStr = `${d.getFullYear()}/${
          d.getMonth() + 1
        }/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(
          2,
          "0"
        )}`;
      }
      html += `<li>${data.name}：${data.score}点 <span style="color:#888;font-size:0.9em;">(${dateStr})</span></li>`;
    });
    html += "</ol>";
    $("#rankingList").html(html);
  }

  // ページ移動のボタンイベント登録
  $("#startQuizBtn").on("click", showQuizScreen);
  $("#showRankingBtn").on("click", showRankingScreen);
  $("#backToHomeFromQuiz").on("click", showHome);
  $("#backToHomeFromRanking").on("click", showHome);

  // 最初はホーム画面
  showHome();
});
