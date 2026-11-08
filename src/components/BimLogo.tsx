import Image from "next/image";

type Props = {
  variant?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

/** Logo institucional BIM (PNG oficial / versión blanca para header verde). */
export function BimLogo({ variant = "dark", compact = false, className }: Props) {
  const src = variant === "light" ? "/bim-logo-white.png" : "/bim-logo.png";
  const height = compact ? 34 : 48;
  const width = compact ? 100 : 150;

  return (
    <div className={`bim-logo ${className || ""}`.trim()}>
      <Image
        src={src}
        alt="BIM · Banco Inmobiliario Mexicano"
        width={width}
        height={height}
        priority
        style={{ width: "auto", height, objectFit: "contain" }}
      />
    </div>
  );
}
