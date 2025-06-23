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
  let isFirstTime = true; // 1問目判定用bool
  let timer = null; // カウントダウン制御用
  let currentQuestionIndex = 0; // 出題データ選択用インデックス
  let correctCount = 0; // 正解数カウント変数
  let totalQuestions = 2; // 出題数
  let questionCount = 0; // 今何問目か
  let usedIndexes = []; // 出題済みのインデックス
  let isComposing = false;

  // スタートボタン押下時処理
  $("#startButton")
    .off("click")
    .on("click", function () {
      // 二重実行防止
      if (timer) return;
      // 全問出題済み
      if (questionCount >= totalQuestions) return;
      console.log("click startButton");

      // 表示を初期化
      // $("#startButton").prop("disabled", true);
      $("#startButton").hide();
      $("#questionNumber").show();
      $("#countdown").show();
      $("#quizArea").empty();
      $("#message").empty();

      // 第何問目かを表示
      $("#questionNumber").text("第" + (questionCount + 1) + "問");
      // カウントダウン表示
      let countdown = 3;
      $("#countdown").text(countdown);

      // カウントダウンの間イントロを再生
      timer = setInterval(function () {
        // デクリメント
        countdown--;
        if (countdown <= 0) {
          clearInterval(timer);
          $("#countdown").text("イントロ再生中");
          playIntro();
        } else {
          $("#countdown").text(countdown);
        }
      }, 1000);
    });

  // イントロ再生関数
  function playIntro() {
    console.log("playIntro()");
    // 未出題の中からランダムに選ぶ
    let availableIndexes = quizData
      // 要素は受け取るけど使わない
      // 配列から配列を作成（今回はインデックスのみ抽出）
      .map(function (_, i) {
        return i;
      })
      // 条件に一致する要素のみ保持する
      .filter(function (i) {
        return !usedIndexes.includes(i);
      });
    if (availableIndexes.length === 0) return;

    // 使用可能なインデックスの中から、乱数生成
    currentQuestionIndex =
      availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    usedIndexes.push(currentQuestionIndex);
    console.log("currentQuestionIndex : " + currentQuestionIndex);

    // イントロ再生
    // jQueryでAudio要素は扱えないため、ネイティブな書き方をする
    const audio = document.getElementById("introAudio");
    audio.src = quizData[currentQuestionIndex].audio;
    audio.play();

    // 指定秒数イントロ再生後、クイズ関数実行
    setTimeout(function () {
      audio.pause();
      $("#countdown").hide();
      showQuiz();
    }, 1000);
  }

  // クイズ関数
  function showQuiz() {
    // インデックスからクイズデータを取得
    const correctTitle = quizData[currentQuestionIndex].title;

    // 問題文を表示
    // $("#quizArea").empty();
    const questionElem = $("<h2>").text("この曲のタイトルは？");
    const inputElem = $(
      '<input type="text" id="answerInput" placeholder="曲名を入力">'
    );
    const submitBtn = $('<button id="submitBtn">回答する</button>');

    $("#quizArea").append(questionElem, inputElem, submitBtn);

    // 回答ボタン押下時の処理
    $("#submitBtn")
      .off("click")
      .on("click", function () {
        const userAnswer = $("#answerInput").val().trim();
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
        // 正解タイトル
        $("#message").append("<br>「" + correctTitle + "」");
        // CDジャケット画像
        $("#message").append(
          "<br><img src='" +
            quizData[currentQuestionIndex].img +
            "' alt='CDジャケット'>"
        );

        $("#submitBtn").prop("disabled", true);
        $("#answerInput").prop("disabled", true);

        // 回答後に楽曲を再生
        const audio = document.getElementById("introAudio");
        audio.currentTime = 0;
        audio.play();
        setTimeout(function () {
          audio.pause();
          timer = null;
          questionCount++;

          if (questionCount >= totalQuestions) {
            // 全問終了
            $("#message").append(
              "<br>全" +
                totalQuestions +
                "問中、" +
                correctCount +
                "問正解でした！"
            );
            $("#restartButton").show();
            // スコアをFirestoreに保存
            const username = prompt("あなたの名前を入力してください:");
            saveScoreToFirestore(username, correctCount);
          } else {
            // 自動で次の問題へ
            $("#startButton").click();
          }
        }, 8000); // 8秒再生
      });

    // エンターキーでも送信できるように
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

  // もう一度遊ぶボタンクリック時の処理
  $("#restartButton").click(function () {
    // ページの再読み込み
    location.reload();
  });

  // スコアをFirestoreに保存
  async function saveScoreToFirestore(username, score) {
    await addDoc(collection(db, "scores"), {
      name: username,
      score: score,
      date: serverTimestamp(),
    });
  }
});
