export default function sketch(p, props) {
  let img;

  p.preload = () => {
    img = p.loadImage(props.billboardImage);
  };

  p.setup = () => {
    p.createCanvas(props.width, props.height);
  };

  p.draw = () => {
    p.background(255);
    p.image(img, 0, 0, props.width, props.height);
    // Add your drawing logic here (spraycan, dripping marker)
  };
}
