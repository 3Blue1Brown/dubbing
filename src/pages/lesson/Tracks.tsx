import { useEffect, useRef } from "react";
import { FaMicrophone, FaXmark } from "react-icons/fa6";
import Button from "@/components/Button";
import CheckButton from "@/components/CheckButton";
import TextBox from "@/components/TextBox";
import { useTransform } from "@/components/transform";
import WaveformComponent from "@/components/Waveform";
import { useLesson } from "@/pages/lesson/state";
import { isSafari } from "@/util/browser";
import classes from "./Tracks.module.css";

/** tracks section */
const Tracks = () => {
  /** use lesson state */
  const tracks = useLesson("tracks");
  const updateTrack = useLesson("updateTrack");
  const deleteTrack = useLesson("deleteTrack");
  const length = useLesson("length");
  const time = useLesson("time");
  const sampleRate = useLesson("sampleRate");
  const autoScroll = useLesson("autoScroll");
  const setTime = useLesson("setTime");
  const recordTrack = useLesson("recordTrack");
  const recordTrackUpdated = useLesson("recordTrackUpdated");

  /** sync transform across waveforms */
  const { transform, onWheel, center } = useTransform({
    length,
    time,
    sampleRate,
    autoScroll,
  });

  /** flag that time changed due to user seek */
  const justSeeked = useRef(false);

  /** when current time changes */
  useEffect(() => {
    /** if auto-scroll on, and if didn't change because of seek */
    if (autoScroll && !justSeeked.current)
      /** center view on current time */
      center(time)?.catch(console.error);
    justSeeked.current = false;
  }, [center, time, autoScroll]);

  /** on waveform seek */
  const onSeek = (time: number) => {
    justSeeked.current = true;
    setTime(time);
  };

  return (
    <div className={classes.tracks}>
      {tracks.map(({ name, muted, audio }, index) => {
        /** is this track only one not muted */
        const solod =
          tracks.length > 1 &&
          tracks.every(({ muted }, i) => (i === index ? !muted : muted));

        return (
          <div key={index} className={classes.track}>
            <div className={classes.label}>
              <TextBox
                className={classes.name}
                placeholder="Track name"
                value={name}
                onChange={(value) => updateTrack(index, { name: value })}
              />
              <div className={classes.actions}>
                <CheckButton
                  label="Solo track (mute all others)"
                  checked={solod}
                  onChange={() => {
                    if (solod) updateTrack(-1, { muted: false });
                    else {
                      updateTrack(-1, { muted: true });
                      updateTrack(index, { muted: false });
                    }
                  }}
                >
                  S
                </CheckButton>
                <CheckButton
                  label="Mute track"
                  checked={muted}
                  onChange={(value) => updateTrack(index, { muted: value })}
                >
                  M
                </CheckButton>
                <Button
                  square
                  data-tooltip="Delete track"
                  onClick={() =>
                    window.confirm(
                      `Are you sure you want to delete track "${name}?" No undo.`,
                    ) && deleteTrack(index)
                  }
                >
                  <FaXmark />
                </Button>
              </div>
            </div>
            <div
              className={classes.waveform}
              style={{ paddingBottom: isSafari ? "5px" : 0 }}
              onDoubleClick={(event) => (event.currentTarget.style.height = "")}
            >
              <WaveformComponent
                waveform={audio}
                transform={transform}
                onWheel={onWheel}
                sampleRate={sampleRate}
                time={time}
                onSeek={onSeek}
                totalWaveforms={tracks.length + 1}
              />
            </div>
          </div>
        );
      })}

      <div className={classes.track}>
        <div className={classes.label}>
          <FaMicrophone style={{ color: "var(--gray)" }} />
        </div>
        <div
          className={classes.waveform}
          style={{ paddingBottom: isSafari ? "5px" : 0 }}
        >
          <WaveformComponent
            waveform={recordTrack}
            waveformUpdated={recordTrackUpdated}
            transform={transform}
            onWheel={onWheel}
            sampleRate={sampleRate}
            time={time}
            onSeek={onSeek}
            totalWaveforms={tracks.length + 1}
          />
        </div>
      </div>
    </div>
  );
};

export default Tracks;
