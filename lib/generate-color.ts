export function generateColor(id: string) {
    const colors = [
      { from: "#38bdf8", to: "#0ea5e9" }, // blue
      { from: "#f472b6", to: "#ec4899" }, // pink
      { from: "#34d399", to: "#10b981" }, // green
      { from: "#fbbf24", to: "#f59e0b" }, // yellow
      { from: "#a78bfa", to: "#8b5cf6" }, // purple
      { from: "#f87171", to: "#ef4444" }, // red
      { from: "#fb923c", to: "#f97316" }, // orange
    ];
  
    const index = id
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, curr) => acc + curr, 0) % colors.length;
  
    return colors[index];
  }
  