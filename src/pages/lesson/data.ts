import { request } from "@/util/request";

/** lesson id */
type LessonId = {
  year: string;
  title: string;
  language: string;
};

/** video file url template */
const videoFile = ({ year, title }: LessonId) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/video_url.txt`;

/** sentence translation file url template */
const sentenceTranslationsFile = ({ year, title, language }: LessonId) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/${language}/sentence_translations.json`;

/** word timings file url template */
const wordTimingsFile = ({ year, title }: LessonId) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/english/word_timings.json`;

/** if more than this amount of time between timings, add "pause" characters */
const pauseGap = 2;
/** characters that indicate pause and let user judge time until next sentence */
const pauseChars = Array(10).fill("▪").join(" ");

/** get lesson data */
export const getData = async (lesson: LessonId): Promise<Data> => {
  /** get video url */
  const video =
    (await request<string>(videoFile(lesson), "text")).split(/\/|=/).pop() ??
    "";

  /** get raw translation sentences */
  const translationSentences = await request<_TranslationSentences>(
    sentenceTranslationsFile(lesson),
  );

  for (let index = -1; index < translationSentences.length; index++) {
    const prevEnd = translationSentences[index - 1]?.end || 0;
    const nextStart = translationSentences[index]?.start || 0;
    if (prevEnd < nextStart - pauseGap) {
      translationSentences.splice(index, 0, {
        start: prevEnd,
        end: nextStart,
        input: pauseChars,
        translatedText: pauseChars,
        from_community_srt: "",
      });
      index--;
    }
  }
  const wordTimings = await request<_WordTimings>(wordTimingsFile(lesson));
  const splitEvenly = (text: string, start: number, end: number) => {
    const words = text.split(/\s/);
    const step = (end - start) / words.length;
    return words.map((word, index) => ({
      text: word,
      start: start + step * index,
      end: start + step * (index + 1),
    }));
  };
  const sentences: Sentence[] = translationSentences.map((sentence) => {
    let original = wordTimings
      .filter(
        ([, wordStart, wordEnd]) =>
          wordStart >= sentence.start &&
          wordStart <= sentence.end &&
          wordEnd >= sentence.start &&
          wordEnd <= sentence.end,
      )
      .map(([text, start, end]) => ({ text, start, end }));
    if (!original.length)
      original = splitEvenly(sentence.input, sentence.start, sentence.end);
    const translation = splitEvenly(
      sentence.translatedText,
      sentence.start,
      sentence.end,
    );
    return { original, translation };
  });

  /** video length, based on sentence timings */
  const length = sentences.at(-1)!.translation.at(-1)!.end;

  return { video, sentences, length };
};

/** raw translation sentences format */
type _TranslationSentences = {
  input: string;
  translatedText: string;
  from_community_srt: string;
  start: number;
  end: number;
}[];

/** raw word timings */
type _WordTimings = [string, number, number][];

/** video url */
export type Video = string;

/** sentences text and timings */
export type Sentence = {
  original: { text: string; start: number; end: number }[];
  translation: { text: string; start: number; end: number }[];
};

/** video length, in seconds */
export type Length = number;

/** lesson data */
export type Data = { video: Video; sentences: Sentence[]; length: Length };
