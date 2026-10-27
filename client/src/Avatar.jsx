const COLORS = ['#2748E0', '#0E8F6E', '#C2410C', '#7C3AED', '#B4235A', '#0F766E', '#A16207'];

export default function Avatar({ name = '?', size = 32 }) {
  const hash = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return (
    <span className="avatar" aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.42, background: COLORS[hash % COLORS.length] }}>
      {initials}
    </span>
  );
}
