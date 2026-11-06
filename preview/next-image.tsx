// Preview-only stand-in for next/image (the artifact preview has no Next server).
import mark from "../public/abondhu-mark.png";
type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src: string; priority?: boolean };
export default function Image({ src, priority: _p, ...rest }: Props) {
  void _p;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={src === "/abondhu-mark.png" ? (mark as unknown as string) : src} {...rest} />;
}
