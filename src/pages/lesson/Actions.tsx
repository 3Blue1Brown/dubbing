import { useContext } from "react";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import { LuDownload } from "react-icons/lu";
import { useParams } from "react-router";
import Button from "@/components/Button";
import { LessonContext } from "@/pages/lesson";
import { downloadMp3 } from "@/util/download";

/** actions section */
const Actions = () => {
  /** get url params */
  const { year = "", title = "", language = "" } = useParams();

  const { saving, setSaving, waveform } = useContext(LessonContext);

  return (
    <Button
      accent
      disabled={saving}
      onClick={() => {
        setSaving(true);
        downloadMp3(
          waveform,
          {
            channels: 1,
            sampleRate,
            bitrate: 192,
          },
          [year, title, language, "dub"],
        )
          .catch(console.error)
          .finally(() => setSaving(false));
      }}
    >
      <span>{saving ? "Saving" : "Save"}</span>
      {saving ? <CgSpinnerTwoAlt className="spin" /> : <LuDownload />}
    </Button>
  );
};

export default Actions;
