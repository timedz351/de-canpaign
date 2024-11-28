import { useRef, useEffect } from "react";
import p5 from "p5";

const P5Wrapper = ({ sketch, ...props }) => {
  const wrapperRef = useRef();

  useEffect(() => {
    let canvas = new p5((p) => sketch(p, props), wrapperRef.current);
    return () => {
      canvas.remove();
    };
  }, [sketch, props]);

  return <div ref={wrapperRef}></div>;
};

export default P5Wrapper;
