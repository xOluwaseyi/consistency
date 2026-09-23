import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Consistency: Plan the day. Protect the streak.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const iconPath = join(process.cwd(), "public/icons/icon-512.png");
  const iconBase64 = readFileSync(iconPath).toString("base64");
  const iconSrc = `data:image/png;base64,${iconBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0b12",
          backgroundImage: "radial-gradient(circle at 50% 32%, #23233f 0%, #0b0b12 68%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          width={150}
          height={150}
          style={{ borderRadius: 34, marginBottom: 40 }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#f4f4f8",
            letterSpacing: "-0.02em",
          }}
        >
          Consistency
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#a5b4fc",
            marginTop: 22,
          }}
        >
          Plan the day. Protect the streak.
        </div>
      </div>
    ),
    { ...size },
  );
}
