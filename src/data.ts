import { atom } from "jotai";
import { request } from "./request";
import { setAtom } from "./atoms";

type Lesson = {
  year: number;
  title: string;
  language: string;
};

const testLesson: Lesson = { year: 2019, title: "clacks", language: "italian" };

const videoUrl = ({ year, title }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/video_url.txt`;

const sentenceTranslationsUrl = ({ year, title, language }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/${language}/sentence_translations.json`;

const wordTimingsUrl = ({ year, title }: Lesson) =>
  `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/english/word_timings.json`;

export const videoAtom = atom<string>();
export const sentencesAtom = atom<Sentence[]>();

const getData = async (lesson: Lesson) => {
  const video = (await request<string>(videoUrl(lesson), "text"))
    .split(/\/|=/)
    .pop();
  setAtom(videoAtom, video);
  const translationSentences = await request<_TranslationSentences>(
    sentenceTranslationsUrl(lesson)
  );
  const wordTimings = await request<_WordTimings>(wordTimingsUrl(lesson));
  const sentences: Sentence[] = translationSentences.map((sentence) => {
    const original = wordTimings
      .filter(
        ([, wordStart, wordEnd]) =>
          wordStart >= sentence.start &&
          wordStart <= sentence.end &&
          wordEnd >= sentence.start &&
          wordEnd <= sentence.end
      )
      .map(([text, start, end]) => ({ text, start, end }));

    const translationWords = sentence.translatedText.split(/\s/);
    const duration = sentence.end - sentence.start;
    const timeStep = duration / translationWords.length;
    const translation = translationWords.map((text, index) => ({
      text,
      start: sentence.start + timeStep * index,
      end: sentence.start + timeStep * (index + 1),
    }));
    return { original, translation };
  });
  setAtom(sentencesAtom, sentences);
};

getData(testLesson);

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
