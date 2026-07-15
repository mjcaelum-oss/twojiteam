import type { ScoredSpot } from '../recommendation.types';
import styles from './RecommendationCard.module.css';

const clockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const carIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2a2 2 0 0 1 1.9 1.5L19 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
const heartOutline = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.3 4.5c2 0 3.2 1.2 4.7 3 1.5-1.8 2.7-3 4.7-3C19 4.5 20.7 8 21.2 11c-2.2 4.5-9.2 9-9.2 9z" /></svg>;
const heartFill = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.3 4.5c2 0 3.2 1.2 4.7 3 1.5-1.8 2.7-3 4.7-3C19 4.5 20.7 8 21.2 11c-2.2 4.5-9.2 9-9.2 9z" /></svg>;

const estMinutes = (km: number) => Math.max(5, Math.round((km / 50) * 60)); // 약 50km/h 가정 미리보기

export function RecommendationCard({ spot, selected, liked = false, onSelect, onReject, onToggleLike }: { spot: ScoredSpot; selected: boolean; liked?: boolean; onSelect: () => void; onReject: () => void; onToggleLike?: () => void }) {
  const hasDistance = spot.distanceKm !== undefined;
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ''}`}>
      {onToggleLike && (
        <button type="button" className={`${styles.heart} ${liked ? styles.hearted : ''}`} aria-label={liked ? '찜 해제' : '찜하기'} aria-pressed={liked} onClick={onToggleLike}>
          {liked ? heartFill : heartOutline}
        </button>
      )}
      <button type="button" className={styles.body} onClick={onSelect}>
        <div className={styles.thumb} style={spot.photoUrl ? { backgroundImage: `url(${spot.photoUrl})` } : undefined}>
          {!spot.photoUrl && <span className={styles.initial}>{spot.name.trim().charAt(0)}</span>}
          <span className={styles.badge}>
            {hasDistance ? carIcon : clockIcon}
            {hasDistance ? `${spot.distanceKm!.toFixed(1)}km · 약 ${estMinutes(spot.distanceKm!)}분` : `체류 ${spot.durationMinutes}분`}
          </span>
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}>{spot.name}</div>
          <p className={styles.desc}>{spot.region} · {spot.description}</p>
          {spot.tags.length > 0 && <div className={styles.tags}>{spot.tags.slice(0, 3).map((tag) => <span key={tag} className={styles.tag}>#{tag}</span>)}</div>}
          {spot.reason && <p className={styles.reason}>{spot.reason}</p>}
        </div>
      </button>
    </article>
  );
}
