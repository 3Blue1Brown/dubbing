import { useState, type FormEventHandler } from "react";
import { useNavigate } from "react-router";
import Button from "@/components/Button";
import FileBox from "@/components/FileBox";
import TextBox from "@/components/TextBox";
import {
  parseSRT,
  type _Data,
  type _TranslationSentences,
  type _WordTimings,
} from "@/pages/lesson/data";

const Home = () => {
  const [year, setYear] = useState("2019");
  const [title, setTitle] = useState("clacks");
  const [language, setLanguage] = useState("italian");

  const [video, setVideo] = useState("https://youtu.be/HEfHFsfGXjs");
  const [translationSentences, setTranslationSentences] =
    useState<_TranslationSentences>([]);
  const [wordTimings, setWordTimings] = useState<_WordTimings>([]);

  const navigate = useNavigate();

  const onSubmit =
    (upload = false): FormEventHandler<HTMLFormElement> =>
    (event) => {
      event.preventDefault();

      navigate(
        /** go to lesson page */
        `/${year}/${title}/${language}`,
        /** pass raw data in state object if uploaded */
        upload
          ? {
              state: {
                video,
                translationSentences,
                wordTimings,
              } satisfies _Data,
            }
          : undefined,
      )?.catch(console.error);
    };

  return (
    <>
      <h1>3Blue1Brown Dubbing App</h1>

      <p>
        Select a video in one of the ways below. See a{" "}
        <a href="https://github.com/3b1b/captions/tree/main" target="_blank">
          listing of videos here
        </a>
        .
      </p>

      <hr />

      <form onSubmit={onSubmit()}>
        <div className="form-grid">
          <TextBox required value={year} onChange={setYear}>
            Year
          </TextBox>
          <TextBox required value={title} onChange={setTitle}>
            Title
          </TextBox>
          <TextBox required value={language} onChange={setLanguage}>
            Language
          </TextBox>
        </div>

        <Button accent type="submit">
          Start Dubbing
        </Button>
      </form>

      <hr />

      <form onSubmit={onSubmit(true)}>
        <div className="form-grid">
          <TextBox value={video} onChange={setVideo}>
            Video
          </TextBox>
          <FileBox
            required
            accept="application/x-subrip,.srt,application/json,.json"
            onChange={(content, filename) =>
              setTranslationSentences(
                filename.endsWith(".json")
                  ? (JSON.parse(content) as _TranslationSentences)
                  : parseSRT(content),
              )
            }
          >
            Translation Sentences
          </FileBox>
          <FileBox
            accept="application/json,.json"
            onChange={(content) => setWordTimings(JSON.parse(content))}
          >
            Original Word Timings
          </FileBox>
        </div>

        <Button accent type="submit">
          Start Dubbing
        </Button>
      </form>

      <p>
        Examples:
        <br />
        <a
          href="https://github.com/3b1b/captions/blob/main/2019/clacks/italian/auto_generated.srt"
          target="_blank"
        >
          Translation Sentences SRT
        </a>
        <br />
        <a
          href="https://github.com/3b1b/captions/blob/main/2019/clacks/italian/sentence_translations.json"
          target="_blank"
        >
          Translation Sentences JSON
        </a>
        <br />
        <a
          href="https://github.com/3b1b/captions/blob/main/2019/clacks/english/word_timings.json"
          target="_blank"
        >
          Original Word Timings JSON
        </a>
      </p>
    </>
  );
};

export default Home;
