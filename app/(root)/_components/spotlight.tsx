// components/ui/spotlight.jsx
type SpotlightProps = {
  className?: string;
  fill?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Spotlight = ({ className = "", fill = "blue" }: SpotlightProps) => {
  return (
    <div
      className={`fixed w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)`,
        zIndex: 0
      }}
    />
  );
};