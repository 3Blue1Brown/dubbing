import { atom } from "jotai";
import { setAtom } from "@/util/atoms";
import { request } from "@/util/request";

type Lesson = {
  year: string;
  title: string;
  language: string;
};

const videoUrl = ({ year, title }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/video_url.txt`;

const sentenceTranslationsUrl = ({ year, title, language }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/${language}/sentence_translations.json`;

const wordTimingsUrl = ({ year, title }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/english/word_timings.json`;

export const videoAtom = atom<string>();
export const sentencesAtom = atom<Sentence[]>();
export const lengthAtom = atom<number>(1);

const pauseGap = 2;
const pauseChars = Array(10).fill("▪").join(" ");

let gotten = false;

export const getData = async (lesson: Lesson) => {
  if (gotten) return;

  gotten = true;

  const video = (await request<string>(videoUrl(lesson), "text"))
    .split(/\/|=/)
    .pop();
  setAtom(videoAtom, video);
  const translationSentences = await request<_TranslationSentences>(
    sentenceTranslationsUrl(lesson),
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
  const wordTimings = await request<_WordTimings>(wordTimingsUrl(lesson));
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
  setAtom(sentencesAtom, sentences);
  setAtom(lengthAtom, sentences.at(-1)!.translation.at(-1)!.end);
};

type _TranslationSentences = {
  input: string;
  translatedText: string;
  from_community_srt: string;
  start: number;
  end: number;
}[];

type _WordTimings = [string, number, number][];

export type Sentence = {
  original: { text: string; start: number; end: number }[];
  translation: { text: string; start: number; end: number }[];
};
