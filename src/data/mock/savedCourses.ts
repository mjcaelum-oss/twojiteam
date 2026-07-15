// 마이페이지 "저장된 여행 코스" 목업 데이터. 백엔드 연동 전까지 상세 페이지가 함께 사용합니다.
export interface CourseSpot {
  name: string;
  region: string;
  description: string;
  durationMinutes: number;
  fee: string;
  hours: string;
  address: string;
}
export interface SavedCourse {
  id: string;
  name: string;
  initial: string;
  spots: CourseSpot[];
}

export const savedCourses: SavedCourse[] = [
  {
    id: 'seoul-palace',
    name: '서울 고궁 산책',
    initial: '서',
    spots: [
      { name: '경복궁', region: '서울 종로구', description: '고궁의 고즈넉한 풍경과 북촌 산책', durationMinutes: 120, fee: '성인 3,000원', hours: '09:00~18:00(계절별 변동)', address: '서울 종로구 사직로 161' },
      { name: '창덕궁', region: '서울 종로구', description: '후원과 어우러진 조선 왕궁의 아름다움', durationMinutes: 90, fee: '성인 3,000원', hours: '09:00~18:00', address: '서울 종로구 율곡로 99' },
      { name: '북촌한옥마을', region: '서울 종로구', description: '전통 한옥과 골목을 걷는 도심 여행', durationMinutes: 90, fee: '무료(일부 체험 유료)', hours: '상시', address: '서울 종로구 북촌로 일대' }
    ]
  },
  {
    id: 'jeju-nature',
    name: '제주 자연 일주',
    initial: '제',
    spots: [
      { name: '제주 성산일출봉', region: '제주 서귀포시', description: '화산 지형 위에서 만나는 멋진 일출', durationMinutes: 120, fee: '성인 5,000원', hours: '07:00~20:00(변동 가능)', address: '제주 서귀포시 성산읍 일출로 284-12' },
      { name: '만장굴', region: '제주 제주시', description: '신비로운 용암 동굴을 걷는 여행', durationMinutes: 90, fee: '성인 약 4,000원', hours: '09:00~18:00(운영 여부 확인)', address: '제주 제주시 구좌읍 만장굴길 182' },
      { name: '협재해수욕장', region: '제주 제주시', description: '에메랄드빛 바다와 노을이 아름다운 해변', durationMinutes: 120, fee: '무료', hours: '상시', address: '제주 제주시 한림읍 협재리 2497-1' }
    ]
  },
  {
    id: 'busan-sea',
    name: '부산 바다 코스',
    initial: '부',
    spots: [
      { name: '해운대해수욕장', region: '부산 해운대구', description: '넓은 백사장과 부산의 대표 바다', durationMinutes: 120, fee: '무료', hours: '상시', address: '부산 해운대구 해운대해변로 264' },
      { name: '광안리해수욕장', region: '부산 수영구', description: '광안대교 야경과 해변 카페를 즐기는 곳', durationMinutes: 120, fee: '무료', hours: '상시', address: '부산 수영구 광안해변로 219' },
      { name: '부산 감천문화마을', region: '부산 사하구', description: '알록달록한 골목과 바다 전망', durationMinutes: 120, fee: '무료', hours: '09:00~18:00', address: '부산 사하구 감내2로 203' }
    ]
  },
  {
    id: 'jeonju-hanok',
    name: '전주 한옥 나들이',
    initial: '전',
    spots: [
      { name: '전주 한옥마을', region: '전북 전주시', description: '한옥 골목과 맛있는 전주 음식', durationMinutes: 180, fee: '무료(일부 체험 유료)', hours: '상시', address: '전북 전주시 완산구 기린대로 99' },
      { name: '경기전', region: '전북 전주시', description: '조선 왕조의 역사와 고즈넉한 전각 산책', durationMinutes: 90, fee: '성인 3,000원', hours: '09:00~18:00', address: '전북 전주시 완산구 태조로 44' }
    ]
  }
];

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
}
export function courseTotalMinutes(course: SavedCourse): number {
  return course.spots.reduce((total, spot) => total + spot.durationMinutes, 0);
}
export function courseMeta(course: SavedCourse): string {
  return `${course.spots.length}곳 · 관광 예상 ${formatDuration(courseTotalMinutes(course))}`;
}
export function findCourse(id: string | undefined): SavedCourse | undefined {
  return savedCourses.find((course) => course.id === id);
}
