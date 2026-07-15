import type { ScoredSpot } from '../recommendation.types';
import type { ReactNode } from 'react';
import styles from './RecommendationCard.module.css';
import type { SpotColor } from '../../map/spotColors';
import type { TravelStyle } from '../../../types/travelPlan';

const clockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const carIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2a2 2 0 0 1 1.9 1.5L19 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
const heartOutline = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.3 4.5c2 0 3.2 1.2 4.7 3 1.5-1.8 2.7-3 4.7-3C19 4.5 20.7 8 21.2 11c-2.2 4.5-9.2 9-9.2 9z" /></svg>;
const heartFill = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.3 4.5c2 0 3.2 1.2 4.7 3 1.5-1.8 2.7-3 4.7-3C19 4.5 20.7 8 21.2 11c-2.2 4.5-9.2 9-9.2 9z" /></svg>;
const categoryMeta: Record<TravelStyle, { label: string; icon: ReactNode }> = {
  culture: { label: '문화·역사', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7M3 9h18" /></svg> },
  nature: { label: '자연·경관', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 21V9M5 21c0-4 2.5-6 7-6s7 2 7 6M7 11c0-3 2-5 5-5s5 2 5 5" /></svg> },
  food: { label: '맛집·카페', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 1 4 3 4 6h-4" /></svg> },
  activity: { label: '체험·액티비티', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" /></svg> },
};
const tagLabels: Record<string, string> = {
  culture: '문화·역사', nature: '자연·경관', food: '맛집·카페', activity: '체험·액티비티', balanced: '균형 여행',
  tourist_attraction: '대표 명소', museum: '박물관', park: '공원·자연', art_gallery: '미술관', historical_landmark: '역사 명소',
  restaurant: '맛집', cafe: '카페', bakery: '베이커리', amusement_park: '테마파크', zoo: '동물원', aquarium: '아쿠아리움',
  beach: '해변', garden: '정원·공원', hiking_area: '트레킹', observation_deck: '전망 명소',
  shopping_mall: '쇼핑몰', performing_arts_theater: '공연장', stadium: '스포츠 명소', place_of_worship: '종교 명소',
  spa: '스파·웰니스', night_club: '나이트라이프', historical_place: '역사 유적'
};
function displayTags(spot: ScoredSpot): string[] {
  const genericTags = new Set(['문화·역사', '자연·경관', '맛집·카페', '체험·액티비티', '균형 여행', '대표 명소']);
  const tags = spot.tags.map((tag) => tagLabels[tag]).filter((tag): tag is string => Boolean(tag) && !genericTags.has(tag));
  if (!tags.length) tags.push(tagLabels[spot.category]);
  if (spot.popularity >= .85) tags.push('인기 명소');
  else if (spot.popularity >= .7) tags.push('평점 좋은 곳');
  if (spot.durationMinutes >= 120) tags.push('여유롭게 관람');
  else if (spot.durationMinutes <= 60) tags.push('가볍게 들르기');
  if (spot.openingHours.note) tags.push('운영시간 확인 필요');
  if (spot.feeNote.includes('가격 정보 없음')) tags.push('가격 확인 필요');
  if (spot.feeNote.includes('무료')) tags.push('무료');
  return [...new Set(tags)].slice(0, 4);
}

const estMinutes = (km: number) => Math.max(5, Math.round((km / 50) * 60)); // 약 50km/h 가정 미리보기

export function RecommendationCard({ spot, selected, liked = false, mapColor, onSelect, onToggleLike }: { spot: ScoredSpot; selected: boolean; liked?: boolean; mapColor?: SpotColor; onSelect: () => void; onToggleLike?: () => void }) {
  const hasDistance = spot.distanceKm !== undefined;
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ''}`}>
      {onToggleLike && (
        <button type="button" className={`${styles.heart} ${liked ? styles.hearted : ''}`} aria-label={liked ? '찜 해제' : '찜하기'} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>
          {liked ? heartFill : heartOutline}
        </button>
      )}
      <button type="button" className={styles.body} aria-label={`${spot.name} 선택 후 다음 후보 보기`} onClick={onSelect}>
        <div className={styles.thumb} style={spot.photoUrl ? { backgroundImage: `url(${spot.photoUrl})` } : undefined}>
          {!spot.photoUrl && <span className={styles.initial}>{spot.name.trim().charAt(0)}</span>}
          <span className={styles.badge}>
            {hasDistance ? carIcon : clockIcon}
            {hasDistance ? `${spot.distanceKm!.toFixed(1)}km · 약 ${estMinutes(spot.distanceKm!)}분` : `체류 ${spot.durationMinutes}분`}
          </span>
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}><span className={styles.categoryIcon} aria-label={categoryMeta[spot.category].label} title={categoryMeta[spot.category].label}>{categoryMeta[spot.category].icon}</span>{spot.name}</div>
          <p className={styles.desc}>{spot.region} · {spot.description}</p>
          {spot.openingHours.note && <p className={styles.hoursNotice}>⚠ {spot.openingHours.note}</p>}
          {displayTags(spot).length > 0 && <div className={styles.tags}>{displayTags(spot).map((tag) => <span key={tag} className={styles.tag}>#{tag}</span>)}</div>}
          {spot.reason && <p className={styles.reason}>{spot.reason}</p>}
        </div>
      </button>
      {mapColor && <div className={styles.mapColor} style={{ backgroundColor: mapColor.value }} aria-label={`지도 표시 색상 ${mapColor.name}`} title={`지도 표시 색상: ${mapColor.name}`} />}
    </article>
  );
}
