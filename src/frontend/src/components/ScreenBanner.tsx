interface ScreenBannerProps {
  screenName: string;
  routeName: string;
}

export default function ScreenBanner({
  screenName,
  routeName,
}: ScreenBannerProps) {
  return (
    <div style={{ padding: "8px 12px", backgroundColor: "#FFD54A" }}>
      <p
        style={{
          fontWeight: 800,
          color: "#000",
          margin: 0,
          fontSize: "13px",
          fontFamily: "monospace",
        }}
      >
        SCREEN: {screenName} | ROUTE: {routeName}
      </p>
    </div>
  );
}
