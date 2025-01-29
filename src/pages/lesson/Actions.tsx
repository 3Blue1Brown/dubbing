import { CgSpinnerTwoAlt } from "react-icons/cg";
import { LuDownload } from "react-icons/lu";
import { useParams } from "react-router";
import Button from "@/components/Button";
import { useLesson } from "@/pages/lesson/state";
import { downloadZip, getMp3 } from "@/util/download";

/** actions section */
const Actions = () => {
  /** use url params */
  const { year = "", title = "", language = "" } = useParams();

  /** use lesson state */
  const saving = useLesson("saving");
  const setSaving = useLesson("setSaving");
  const tracks = useLesson("tracks");
  const sampleRate = useLesson("sampleRate");

  return (
    <Button
      accent
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        const filename = [year, title, language, "dub"];
        try {
          /** get mp3 file blobs */
          const files = await Promise.all(
            tracks.map(async ({ name, audio }, index) => ({
              blob: await getMp3(audio, {
                channels: 1,
                sampleRate,
                bitrate: 192,
              }),
              filename: name ?? `Track ${index + 1}`,
              ext: "mp3",
            })),
          );
          /** zip together and download */
          await downloadZip(files, filename);
        } catch (error) {
          console.error(error);
        } finally {
          setSaving(false);
        }
      }}
    >
      <span>{saving ? "Saving" : "Save"}</span>
      {saving ? <CgSpinnerTwoAlt className="spin" /> : <LuDownload />}
    </Button>
  );
};

export default Actions;
