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
