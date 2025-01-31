import { useState, type FormEventHandler } from "react";
import { useNavigate } from "react-router";
import Button from "@/components/Button";
import FileBox from "@/components/FileBox";
import TextBox from "@/components/TextBox";
import type { _TranslationSentences, _WordTimings } from "@/pages/lesson/data";

const Home = () => {
  const [year, setYear] = useState("2019");
  const [title, setTitle] = useState("clacks");
  const [language, setLanguage] = useState("italian");

  const [video, setVideo] = useState("https://youtu.be/HEfHFsfGXjs");
  const [translationSentences, setTranslationSentences] =
    useState<_TranslationSentences>();
  const [wordTimings, setWordTimings] = useState<_WordTimings>();

  const navigate = useNavigate();

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    navigate(
      /** go to lesson page */
      `/${year}/${title}/${language}`,
      /** pass raw data in state object if available */
      translationSentences && wordTimings
        ? {
            state: {
              video,
              translationSentences,
              wordTimings,
            },
          }
        : undefined,
    )?.catch(console.error);
  };

  return (
    <>
      <h1>3Blue1Brown Dubbing App</h1>

      <p>
        Select a video in one of the ways below to begin dubbing. See a{" "}
        <a href="https://github.com/3b1b/captions/tree/main">
          listing of videos here
        </a>
        .
      </p>

      <hr />

      <form onSubmit={onSubmit}>
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

        <Button accent>Go</Button>
      </form>

      <hr />

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <TextBox value={video} onChange={setVideo}>
            Video
          </TextBox>
          <FileBox
            required
            onChange={(value) => setTranslationSentences(JSON.parse(value))}
          >
            Sentence translations
            <br />(
            <a
              href="https://github.com/3b1b/captions/blob/main/2019/clacks/italian/sentence_translations.json"
              target="_blank"
            >
              example
            </a>
            )
          </FileBox>
          <FileBox
            required
            onChange={(value) => setWordTimings(JSON.parse(value))}
          >
            Word Timings
            <br />(
            <a
              href="https://github.com/3b1b/captions/blob/main/2019/clacks/english/word_timings.json"
              target="_blank"
            >
              example
            </a>
            )
          </FileBox>
        </div>

        <Button accent>Go</Button>
      </form>
    </>
  );
};

export default Home;
