import { ImageResponse } from "next/og";

export const alt = "WeldHub - usługi spawalnicze i ślusarskie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#05070a", color: "white", padding: "80px" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 42, fontWeight: 800 }}>
        Weld<span style={{ color: "#f97316" }}>Hub</span>
      </div>
      <div style={{ marginTop: 52, maxWidth: 930, fontSize: 68, lineHeight: 1.08, fontWeight: 800 }}>
        Fachowcy od metalu w jednym miejscu
      </div>
      <div style={{ marginTop: 32, maxWidth: 900, color: "#94a3b8", fontSize: 30, lineHeight: 1.4 }}>
        Dodaj zlecenie lub znajdź wykonawcę usług spawalniczych i ślusarskich.
      </div>
      <div style={{ position: "absolute", right: 80, bottom: 70, width: 170, height: 10, borderRadius: 99, background: "#f97316" }} />
    </div>,
    size
  );
}
