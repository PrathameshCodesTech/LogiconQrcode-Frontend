interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
}

export default function BrandLogo({
  className = '',
  imageClassName = 'h-10 w-auto',
}: BrandLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/LOGO-2-1.webp"
        alt="Logicon"
        className={imageClassName}
      />
    </div>
  );
}
