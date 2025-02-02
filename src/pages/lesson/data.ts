import srtParser2 from "srt-parser-2";
import { request } from "@/util/request";

/** raw input data */
export type _Data = {
  video: string;
  translation: SRT;
  original: SRT;
};

/** parse SRT file entries */
export const parseSRT = (content: string) =>
  new srtParser2()
    .fromSrt(content)
    .map(({ text, startSeconds, endSeconds }) => ({
      text: text.trim(),
      start: startSeconds,
      end: endSeconds,
    }));

export type SRT = ReturnType<typeof parseSRT>;

/** if more than this amount of time between timings, add "pause" characters */
const pauseGap = 2;
/** characters that indicate pause and let user judge time until next sentence */
const pauseChars = Array(10).fill("▪").join(" ");

/** add "pause" entry between SRT entries whose start/end times have gap */
const fillSRT = (srt: SRT): SRT => {
  for (let index = -1; index < srt.length; index++) {
    const prevEnd = srt[index - 1]?.end || 0;
    const nextStart = srt[index]?.start || 0;
    if (prevEnd < nextStart - pauseGap) {
      srt.splice(index, 0, {
        text: pauseChars,
        start: prevEnd,
        end: nextStart,
      });
      index--;
    }
  }
  return srt;
};

/** split each SRT entry by word (if not already) */
const splitSRT = (srt: SRT): SRT =>
  srt
    .map(({ text, start, end }) => {
      /** split into words */
      const words = text.split(/\s+/);
      /** distribute evenly between start/end times */
      const step = (end - start) / words.length;
      return words.map((word, index) => ({
        text: word.trim(),
        start: start + step * index,
        end: start + step * (index + 1),
      }));
    })
    .flat();

/** parse lesson data into format needed for app */
export const parseData = async ({
  video,
  translation,
  original,
}: _Data): Promise<Data> => {
  /** get just video id */
  video = video.split(/\/|=/).pop() ?? "";

  /** fill in gaps */
  translation = fillSRT(translation);
  original = fillSRT(original);

  /** find original item within time frame of translation item */
  const findOriginal = (original: SRT[number], translation: SRT[number]) =>
    original.start >= translation.start && original.start < translation.end;

  /** for each translation item (assumed to be sentence-level) */
  const sentences: Sentence[] = translation.map((translation) => {
    const originalStart = original.findIndex((original) =>
      findOriginal(original, translation),
    );
    const originalEnd = original.findLastIndex((original) =>
      findOriginal(original, translation),
    );
    return {
      original:
        originalStart !== -1 &&
        originalEnd !== -1 &&
        originalEnd >= originalStart
          ? splitSRT(
              original.splice(originalStart, originalEnd + 1 - originalStart),
            )
          : [],
      translation: splitSRT([translation]),
    };
  });

  /** video length, based on sentence timings */
  const length = sentences.at(-1)!.translation.at(-1)!.end;

  return { video, sentences, length };
};

/** fetch lesson data from external files */
export const fetchData = async (
  year: string,
  title: string,
  language: string,
): Promise<_Data> => {
  /** file locations */
  const videoUrl = `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/video_url.txt`;
  const sentenceTranslations = `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/${language}/sentence_translations.json`;
  const wordTimings = `https://raw.githubusercontent.com/3b1b/captions/refs/heads/main/${year}/${title}/english/word_timings.json`;

  /** file formats */
  type _SentenceTranslations = {
    translatedText: string;
    start: number;
    end: number;
  }[];
  type _WordTimings = [string, number, number][];

  const [video, translation, original] = await Promise.all([
    request(videoUrl, "text"),
    request<_SentenceTranslations>(sentenceTranslations),
    request<_WordTimings>(wordTimings),
  ]);

  return {
    video,
    translation: translation.map(({ translatedText, start, end }) => ({
      text: translatedText.trim(),
      start,
      end,
    })),
    original: original.map(([text, start, end]) => ({
      text: text.trim(),
      start,
      end,
    })),
  };
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
