import type { CourseIndex } from "../types";

interface CourseCardProps {
  course: CourseIndex & { distance: number };
  isSelected: boolean;
  onClick: () => void;
}

export function CourseCard({ course, isSelected, onClick }: CourseCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? "bg-emerald-50 border-emerald-400 shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{course.n}</h3>
          {course.cn !== course.n && (
            <p className="text-xs text-gray-500 truncate">{course.cn}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {course.city}, {course.st}
          </p>
        </div>
        <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
          {course.distance.toFixed(1)} mi
        </span>
      </div>
      <div className="flex gap-3 mt-3">
        {course.par && (
          <Stat label="Par" value={course.par} />
        )}
        {course.yards && (
          <Stat label="Yards" value={course.yards.toLocaleString()} />
        )}
        {course.holes && (
          <Stat label="Holes" value={course.holes} />
        )}
        {course.rating && (
          <Stat label="Rating" value={course.rating.toFixed(1)} />
        )}
        {course.slope && (
          <Stat label="Slope" value={course.slope} />
        )}
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xs font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}
