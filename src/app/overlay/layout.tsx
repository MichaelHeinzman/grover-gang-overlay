export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "1920px",
        height: "1080px",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <style>{`
        html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      {children}
    </div>
  );
}
