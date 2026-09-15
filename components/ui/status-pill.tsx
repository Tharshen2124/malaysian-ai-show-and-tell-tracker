export function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.72rem] leading-[1.4] tracking-[0.02em] ${
        isActive ? "border-success-line text-success" : "border-hairline text-muted"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
