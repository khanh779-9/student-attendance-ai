const VARIANT_CLASSES = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  secondary:
    "bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-inset ring-slate-300 shadow-sm",
  danger: "bg-rose-700 text-white shadow-sm hover:bg-rose-800",
  ghost: "bg-slate-100 text-slate-800 hover:bg-slate-200",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const base =
    "appearance-none border-0 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
  const classes = [
    base,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    className,
  ].join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
