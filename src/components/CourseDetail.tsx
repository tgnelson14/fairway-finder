import { useCourseDetail } from "../hooks/useCourseDetail";
import { Scorecard } from "./Scorecard";

interface CourseDetailProps {
  courseId: number;
  courseName: string;
  onClose: () => void;
}

export function CourseDetail({ courseId, courseName, onClose }: CourseDetailProps) {
  const { course, loading, error } = useCourseDetail(courseId);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white truncate pr-4">{courseName}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <p className="text-sm text-slate-500 mt-2">
                This may be due to the daily API limit (300 requests/day).
              </p>
            </div>
          )}

          {course && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const tee = course.tees.male?.[0] || course.tees.female?.[0];
                  if (!tee) return null;
                  return (
                    <>
                      <StatBox label="Par" value={tee.par_total} />
                      <StatBox label="Yards" value={tee.total_yards.toLocaleString()} />
                      <StatBox label="Rating" value={tee.course_rating.toFixed(1)} />
                      <StatBox label="Slope" value={tee.slope_rating} />
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-300">Location</h3>
                <p className="text-sm text-slate-400">{course.location.address}</p>
              </div>

              {course.tees.male && course.tees.male.length > 0 && (
                <div className="space-y-4">
                  {course.tees.male.map((tee, i) => (
                    <Scorecard key={`m-${i}`} tees={tee} label={`Men's - ${tee.tee_name}`} />
                  ))}
                </div>
              )}

              {course.tees.female && course.tees.female.length > 0 && (
                <div className="space-y-4">
                  {course.tees.female.map((tee, i) => (
                    <Scorecard key={`f-${i}`} tees={tee} label={`Women's - ${tee.tee_name}`} />
                  ))}
                </div>
              )}

              {!course.tees.male?.length && !course.tees.female?.length && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No scorecard data available for this course.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-emerald-400">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
