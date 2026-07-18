import { readLocal, writeLocal } from '../../services/storage/localStorage.service';
import { savedCourses as seedCourses } from '../../data/mock/savedCourses';
import type { CourseSpot, SavedCourse } from '../../data/mock/savedCourses';
import type { TravelPlan } from '../../types/travelPlan';

const KEY = 'saved-courses';

export function getSavedCourses(): SavedCourse[] {
  return readLocal<SavedCourse[]>(KEY, seedCourses);
}
export function findSavedCourse(id: string | undefined): SavedCourse | undefined {
  if (!id) return undefined;
  return getSavedCourses().find((course) => course.id === id);
}
export function addSavedCourse(course: SavedCourse): SavedCourse[] {
  const next = [course, ...getSavedCourses().filter((item) => item.id !== course.id)];
  writeLocal(KEY, next);
  return next;
}
export function removeSavedCourse(id: string): SavedCourse[] {
  const next = getSavedCourses().filter((course) => course.id !== id);
  writeLocal(KEY, next);
  return next;
}
export function planToCourse(plan: TravelPlan): SavedCourse {
  const spots: CourseSpot[] = plan.spots.map((item) => ({
    name: item.spot.name,
    region: item.spot.region,
    description: item.spot.description,
    durationMinutes: item.spot.durationMinutes,
    fee: item.spot.feeAmount ? `${item.spot.feeAmount.toLocaleString()}원` : (item.spot.feeNote || '현장 확인'),
    hours: item.spot.openingHours?.note ?? '방문 전 확인',
    address: item.spot.address ?? item.spot.region,
    photoUrl: item.spot.photoUrl
  }));
  return { id: plan.id, name: plan.title, initial: plan.destination.name.trim().charAt(0) || '여', spots, plan };
}
export function updateSavedCourseName(id: string, name: string): SavedCourse[] {
  const next = getSavedCourses().map((course) => course.id === id ? { ...course, name, plan: course.plan ? { ...course.plan, title: name } : course.plan } : course);
  writeLocal(KEY, next);
  return next;
}
