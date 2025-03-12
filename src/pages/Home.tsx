import { useState, type FormEventHandler } from "react";
import { useNavigate } from "react-router";
import Button from "@/components/Button";
import FileBox from "@/components/FileBox";
import TextBox from "@/components/TextBox";
import { parseSRT, type _Data, type SRT } from "@/pages/lesson/data";

/**
 * references
 *
 * https://github.com/3b1b/captions/blob/main/2019/clacks/italian/auto_generated.srt
 * https://github.com/3b1b/captions/blob/main/2019/clacks/english/captions.srt
 * https://github.com/3b1b/captions/blob/main/2019/clacks/italian/sentence_translations.json
 * https://github.com/3b1b/captions/blob/main/2019/clacks/english/word_timings.json"
 */

const Home = () => {
  const [year, setYear] = useState("2019");
  const [title, setTitle] = useState("clacks");
  const [language, setLanguage] = useState("italian");

  const [video, setVideo] = useState("https://youtu.be/HEfHFsfGXjs");
  const [translation, setTranslation] = useState<SRT>([]);
  const [original, setOriginal] = useState<SRT>([]);

  const navigate = useNavigate();

  const onSubmit =
    (upload = false): FormEventHandler<HTMLFormElement> =>
    (event) => {
      event.preventDefault();

      navigate(
        /** go to lesson page */
        upload ? "/upload" : `/${year}/${title}/${language}`,
        /** pass raw data in state object if uploaded */
        upload
          ? {
              state: {
                video,
                translation,
                original,
              } satisfies _Data,
            }
          : undefined,
      )?.catch(console.error);
    };

  return (
    <>
      <h1>3Blue1Brown Dubbing App</h1>

      <hr />

      <form onSubmit={onSubmit(true)}>
        <div className="form-grid">
          <TextBox value={video} onChange={setVideo}>
            Video
          </TextBox>
          <FileBox
            required
            accept="application/x-subrip,.srt"
            onChange={(content) => setTranslation(parseSRT(content))}
          >
            Translation SRT
          </FileBox>
          <FileBox
            accept="application/x-subrip,.srt"
            onChange={(content) => setOriginal(parseSRT(content))}
          >
            Original SRT
          </FileBox>
        </div>

        <Button accent type="submit">
          Start Dubbing
        </Button>
      </form>

      <hr />

      <p>
        See a{" "}
        <a href="https://github.com/3b1b/captions/tree/main" target="_blank">
          listing of videos here
        </a>
        .
      </p>

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
    </>
  );
};

export default Home;
