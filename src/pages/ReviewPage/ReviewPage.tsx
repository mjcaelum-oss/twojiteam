import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Button } from '../../components/common/Button/Button';
import { TravelMap } from '../../features/map/components/TravelMap';
import { transportLabels } from '../../data/constants/travel.constants';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import { buildSchedule, validateSchedule } from '../../features/schedule-validation/scheduleValidation.service';
import type { TransportMode } from '../../types/travelPlan';
import { getItineraryTotals } from '../../features/itinerary/itinerary.service';
import { addSavedCourse, planToCourse } from '../../features/saved-courses/savedCourses.store';
import styles from './ReviewPage.module.css';

export function ReviewPage() {
  const navigate = useNavigate(); const { plan, setPlan, removeSpot, moveSpot, setTransport, save } = useTravelPlan(); const [saved, setSaved] = useState(false);
  useEffect(() => { if (!plan || !plan.spots.length) navigate('/'); }, [navigate, plan]);
  const schedule = useMemo(() => plan ? buildSchedule(plan) : [], [plan]); const warnings = useMemo(() => plan ? validateSchedule(plan) : [], [plan]);
  if (!plan) return null;
  const { visitMinutes, travelMinutes, estimatedCost: cost } = getItineraryTotals(plan);
  const savePlan = async () => { await save(); addSavedCourse(planToCourse(plan)); setSaved(true); };
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mapCol}>
            <TravelMap spots={plan.spots.map((item) => item.spot)} selected={plan.spots.map((item) => item.spot)} />
          </div>
          <section className={styles.panel}>
            <div className="progress">TRAVEL PLAN</div>
            <h2>여행 계획을 검토해보세요</h2>
            <p className="hint">장소를 삭제하거나 순서를 바꾸고, 구간별 이동수단을 조정할 수 있습니다.</p>
            <div className={styles.summary}>
              <strong>{plan.spots.length}곳 · 총 {Math.floor((visitMinutes + travelMinutes) / 60)}시간 {(visitMinutes + travelMinutes) % 60}분</strong>
              <span>체류 {visitMinutes}분 · 이동 {travelMinutes}분 · 예상 비용 {cost.toLocaleString()}원</span>
            </div>
            {warnings.length > 0 && <div className={styles.warnings} role="status"><strong>일정 확인이 필요합니다</strong>{warnings.map((warning) => <p key={`${warning.spotId}-${warning.kind}`}>{warning.message}</p>)}</div>}
            <ol className={styles.timeline}>
              {plan.spots.map((item, index) => {
                const itemSchedule = schedule[index];
                const route = plan.routes[index];
                const mode = item.transportMode ?? 'DRIVING';
                return (
                  <li key={item.spot.id}>
                    <div className={styles.ticket}>
                      <div className={styles.index}>{index + 1}</div>
                      <div className={styles.thumb}>{item.spot.photoUrl ? <img src={item.spot.photoUrl} alt="" /> : item.spot.name.trim().charAt(0)}</div>
                      <div className={styles.ticketBody}>
                        <strong>{item.spot.name}</strong>
                        <span>{item.spot.region} · {item.spot.feeAmount ? `${item.spot.feeAmount.toLocaleString()}원` : item.spot.feeNote} · {item.spot.durationMinutes}분</span>
                        <small>{itemSchedule?.arrival.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 도착 예상</small>
                        <div className={styles.itemActions}>
                          <Button variant="secondary" type="button" onClick={() => moveSpot(item.spot.id, -1)} disabled={index === 0}>위로</Button>
                          <Button variant="secondary" type="button" onClick={() => moveSpot(item.spot.id, 1)} disabled={index === plan.spots.length - 1}>아래로</Button>
                          <Button variant="secondary" type="button" onClick={() => removeSpot(item.spot.id)}>삭제</Button>
                        </div>
                      </div>
                    </div>
                    {index < plan.spots.length - 1 && (
                      <div className={styles.leg}>
                        <label className={styles.transport}>이동
                          <select value={mode} onChange={(event) => setTransport(index, event.target.value as TransportMode)}>{Object.entries(transportLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                        </label>
                        <span className={styles.legInfo}>{route ? (route.error ? route.error : `${route.durationMinutes}분 · ${(route.distanceMeters / 1000).toFixed(1)}km · ${route.cost.toLocaleString()}원`) : '경로 계산 전'}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => navigate('/recommendations')}>계획 수정</Button>
              <Button type="button" onClick={savePlan}>저장</Button>
              <Button variant="secondary" type="button" onClick={() => { setPlan(null); navigate('/'); }}>새 여행 계획</Button>
            </div>
            {saved && <p className={styles.saved} role="status">여행 계획을 저장했어요. <Link to="/mypage">마이페이지에서 보기</Link></p>}
          </section>
        </div>
      </PageContainer>
    </>
  );
}
