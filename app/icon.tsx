import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#071b3a"
        }}
      >
        <div
          style={{
            display: "flex",
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: "3px solid #d7a14c",
            boxShadow: "inset 0 0 0 2px rgba(244, 211, 137, 0.7)"
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 34,
              height: 34,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -2,
                left: 1,
                color: "#d7a14c",
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "Georgia, serif"
              }}
            >
              T
            </span>
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 14,
                color: "#f6efe2",
                fontSize: 28,
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
