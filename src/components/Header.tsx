export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="5" r="2" />
          <line x1="12" y1="7" x2="12" y2="20" />
          <path d="M12 10 C12 10, 18 12, 18 16 C18 18, 12 20, 12 20" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Fairway<span className="text-emerald-600">Finder</span>
        </h1>
        <p className="text-xs text-gray-500 -mt-0.5">
          Discover golf courses near you
        </p>
      </div>
    </header>
  );
}
