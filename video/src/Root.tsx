import { Composition, Still } from "remotion";
import { Demo } from "./Demo";
import { Banner } from "./Banner";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Still id="Banner" component={Banner} width={1920} height={640} />
    </>
  );
};
