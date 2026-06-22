interface ModuleHelpBannerProps {
  children: React.ReactNode;
}

function ModuleHelpBanner({ children }: ModuleHelpBannerProps) {
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-sm text-slate-700">
      <span className="text-lg leading-none" aria-hidden="true">
        💡
      </span>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

export default ModuleHelpBanner;
