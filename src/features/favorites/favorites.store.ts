export interface LikedSpot { id: string; name: string; region: string; }

export const LIKED_KEY = 'liked-spots';

// 목업 시드 (처음 방문 시 예시로 표시)
export const seedLikedSpots: LikedSpot[] = [
  { id: 'seed-gangneung-anmok', name: '강릉 안목해변', region: '강원 강릉시' },
  { id: 'seed-jeonju-hanok', name: '전주 한옥마을', region: '전북 전주시' },
  { id: 'seed-yeosu-odongdo', name: '여수 오동도', region: '전남 여수시' },
  { id: 'seed-damyang-meta', name: '담양 메타세쿼이아길', region: '전남 담양군' }
];

export function toggleLikedSpot(list: LikedSpot[], spot: LikedSpot): LikedSpot[] {
  return list.some((item) => item.id === spot.id) ? list.filter((item) => item.id !== spot.id) : [spot, ...list];
}
