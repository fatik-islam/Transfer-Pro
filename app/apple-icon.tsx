import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #082041 0%, #071b3a 100%)"
        }}
      >
        <div
          style={{
            display: "flex",
            width: 152,
            height: 152,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: "6px solid #d7a14c",
            boxShadow: "inset 0 0 0 3px rgba(244, 211, 137, 0.72)"
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 92,
              height: 92,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -4,
                left: 4,
                color: "#d7a14c",
                fontSize: 74,
                fontWeight: 700,
                fontFamily: "Georgia, serif"
              }}
            >
              T
            </span>
            <span
              style={{
                position: "absolute",
                top: 19,
                left: 36,
                color: "#f6efe2",
                fontSize: 74,
                fontWeight: 500,
                fontFamily: "Georgia, serif"
              }}
            >
              P
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
