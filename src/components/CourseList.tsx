import type { CourseIndex } from "../types";
import { CourseCard } from "./CourseCard";

interface CourseListProps {
  courses: (CourseIndex & { distance: number })[];
  selectedId: number | null;
  onSelect: (course: CourseIndex & { distance: number }) => void;
}

export function CourseList({ courses, selectedId, onSelect }: CourseListProps) {
  if (courses.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
      <p className="text-sm text-slate-400 mb-1">
        {courses.length} course{courses.length !== 1 ? "s" : ""} found
      </p>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isSelected={course.id === selectedId}
          onClick={() => onSelect(course)}
        />
      ))}
    </div>
  );
}
