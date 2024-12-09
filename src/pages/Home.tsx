import { Link } from "react-router";

const Home = () => (
  <p>
    Go to <code>/YEAR/TITLE/LANGUAGE</code> to begin dubbing.{" "}
    <Link to="/2019/clacks/italian">Example</Link>.<br />
    See a{" "}
    <a href="https://github.com/3b1b/captions/tree/main">
      listing of videos here
    </a>
  </p>
);

export default Home;
