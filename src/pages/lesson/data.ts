import srtParser2 from "srt-parser-2";
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

/** fetch lesson data from external sources */
export const fetchData = async (lesson: LessonId) => ({
  video: await request(videoFile(lesson), "text"),
  translationSentences: await request<_TranslationSentences>(
    sentenceTranslationsFile(lesson),
  ),
  wordTimings: await request<_WordTimings>(wordTimingsFile(lesson)),
});

/** parse lesson data into format needed for app */
export const parseData = async ({
  video,
  translationSentences,
  wordTimings,
}: _Data): Promise<Data> => {
  for (let index = -1; index < translationSentences.length; index++) {
    const prevEnd = translationSentences[index - 1]?.end || 0;
    const nextStart = translationSentences[index]?.start || 0;
    /** add "pause" entry between entries whose start/end times have gap */
    if (prevEnd < nextStart - pauseGap) {
      translationSentences.splice(index, 0, {
        start: prevEnd,
        end: nextStart,
        input: pauseChars,
        translatedText: pauseChars,
      });
      index--;
    }
  }

  /** split sentence into words and distribute evenly between start/end times */
  const splitEvenly = (text: string, start: number, end: number) => {
    const words = text.split(/\s/);
    const step = (end - start) / words.length;
    return words.map((word, index) => ({
      text: word,
      start: start + step * index,
      end: start + step * (index + 1),
    }));
  };

  /** for each sentence */
  const sentences: Sentence[] = translationSentences.map((sentence) => {
    /** (english) */
    let original = wordTimings.length
      ? wordTimings
          /** get all word timings within sentence start/end */
          .filter(
            ([, wordStart, wordEnd]) =>
              wordStart >= sentence.start &&
              wordStart <= sentence.end &&
              wordEnd >= sentence.start &&
              wordEnd <= sentence.end,
          )
          .map(([text, start, end]) => ({ text, start, end }))
      : [];

    /**
     * if no word timings (e.g. inserted pause chars), just make them up from
     * sentence start/end
     */
    if (wordTimings.length && !original.length)
      original = splitEvenly(sentence.input, sentence.start, sentence.end);

    /** (non-english) */
    /** make up word timings */
    const translation = splitEvenly(
      sentence.translatedText,
      sentence.start,
      sentence.end,
    );

    return { original, translation };
  });

  /** video length, based on sentence timings */
  const length = sentences.at(-1)!.translation.at(-1)!.end;

  return { video: video.split(/\/|=/).pop() ?? "", sentences, length };
};

/** convert SRT file to raw translation sentences format */
export const parseSRT = (content: string) =>
  new srtParser2()
    .fromSrt(content)
    .map(({ text, startSeconds, endSeconds }) => ({
      input: "",
      translatedText: text,
      start: startSeconds,
      end: endSeconds,
    }));

/** raw translation sentences format */
export type _TranslationSentences = {
  input: string;
  translatedText: string;
  start: number;
  end: number;
}[];

/** raw word timings */
export type _WordTimings = [string, number, number][];

/** all raw data together */
export type _Data = {
  video: string;
  translationSentences: _TranslationSentences;
  wordTimings: _WordTimings;
};

/** sentences text and timings */
export type Sentence = {
  original: { text: string; start: number; end: number }[];
  translation: { text: string; start: number; end: number }[];
};

/** video length, in seconds */
export type Length = number;

/** lesson data */
export type Data = {
  video: string;
  sentences: Sentence[];
  length: Length;
};
