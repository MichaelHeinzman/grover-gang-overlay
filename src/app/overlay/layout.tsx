import "@/styles/rocket-league-theme.css";

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rl-overlay-root">
      <style>{`html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }`}</style>
      {children}
    </div>
  );
}
