// The Convert icon (public/icons/convert.png) is a black picture on a transparent background. Used as a mask it takes the colour of the
// text around it, so it is white on the yellow Convert button in Actions.
export default function ConvertIcon({ className = 'w-[22px] h-[22px]' }: { className?: string }) {
  const image = 'url(/icons/convert.png)';
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ WebkitMaskImage: image, maskImage: image, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskSize: 'contain', maskSize: 'contain' }}
    />
  );
}
