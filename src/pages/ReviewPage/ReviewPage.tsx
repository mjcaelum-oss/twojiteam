import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Button } from '../../components/common/Button/Button';
import { TravelMap } from '../../features/map/components/TravelMap';
import { transportLabels } from '../../data/constants/travel.constants';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import { buildSchedule, validateSchedule } from '../../features/schedule-validation/scheduleValidation.service';
import type { TransportMode, TravelPlan } from '../../types/travelPlan';
import { getItineraryTotals } from '../../features/itinerary/itinerary.service';
import { addSavedCourse, planToCourse } from '../../features/saved-courses/savedCourses.store';
import { requestRoute } from '../../features/routes/route.service';
import { formatRouteCost } from '../../features/routes/routeCost.utils';
import { loadGoogleMaps } from '../../features/map/googleMaps.loader';
import styles from './ReviewPage.module.css';

const transportIcon = (mode: TransportMode, details?: string) => {
  if (mode === 'WALKING') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="13" cy="4" r="2" /><path d="m11 8 3 2 2 4M11 8l-2 6-3 5M12 10l-1 5 4 5" /></svg>;
  if (mode === 'DRIVING') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2a2 2 0 0 1 1.9 1.5L19 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
  if (details?.includes('지하철')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="3" width="14" height="16" rx="4" /><path d="M8 19l-2 3M16 19l2 3M5 14h14M8 7h8" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 14h16M8 19l-2 3M16 19l2 3M7 9h10" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" /></svg>;
};

export function ReviewPage() {
  const navigate = useNavigate(); const { plan, setPlan, removeSpot, reorderSpot, setTransport, setRoute, save } = useTravelPlan(); const [saved, setSaved] = useState(false); const [saving, setSaving] = useState(false); const [saveComplete, setSaveComplete] = useState(false); const [saveError, setSaveError] = useState(''); const [draggedId, setDraggedId] = useState<string | null>(null); const [selectedDate, setSelectedDate] = useState(''); const [undoPlan, setUndoPlan] = useState<TravelPlan | null>(null); const [saveDialogOpen, setSaveDialogOpen] = useState(false); const [courseTitleDraft, setCourseTitleDraft] = useState('');
  useEffect(() => { if (!plan) navigate('/'); }, [navigate, plan]);
  useEffect(() => { if (!undoPlan) return; const timeout = window.setTimeout(() => setUndoPlan(null), 5000); return () => window.clearTimeout(timeout); }, [undoPlan]);
  const routeKey = plan?.spots.slice(0, -1).map((item, index) => `${item.spot.id}:${plan.spots[index + 1].spot.id}:${plan.spots[index + 1].transportMode ?? 'DRIVING'}`).join('|') ?? '';
  useEffect(() => {
    if (!plan || plan.spots.length < 2) return;
    let active = true;
    void loadGoogleMaps().then(async () => {
      let workingPlan = plan;
      for (const [index, item] of plan.spots.slice(0, -1).entries()) {
        if ((item.travelDate ?? plan.travelDate) !== (plan.spots[index + 1].travelDate ?? plan.travelDate)) continue;
        const departureTime = buildSchedule(workingPlan)[index]?.departure;
        const route = await requestRoute(item.spot, workingPlan.spots[index + 1].spot, workingPlan.spots[index + 1].transportMode ?? 'DRIVING', departureTime);
        if (!active) return;
        setRoute(index, route.summary);
        workingPlan = { ...workingPlan, routes: workingPlan.routes.map((current, routeIndex) => routeIndex === index ? route.summary : current) };
      }
    });
    return () => { active = false; };
  // Route recalculation is keyed by ordered spot ids and transport modes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);
  const schedule = useMemo(() => plan ? buildSchedule(plan) : [], [plan]); const warnings = useMemo(() => plan ? validateSchedule(plan).filter((warning) => (plan.spots.find((item) => item.spot.id === warning.spotId)?.travelDate ?? plan.travelDate) === (selectedDate || plan.travelDate)) : [], [plan, selectedDate]);
  const planningDates = useMemo(() => { if (!plan) return []; const start = new Date(`${plan.travelDate}T00:00:00`); const end = new Date(`${plan.returnDate ?? plan.travelDate}T00:00:00`); const dates: string[] = []; for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`); return dates; }, [plan]);
  const activeDate = planningDates.includes(selectedDate) ? selectedDate : planningDates[0];
  const visibleSpots = plan ? plan.spots.map((item, index) => ({ item, index })).filter(({ item }) => (item.travelDate ?? plan.travelDate) === activeDate) : [];
  const visibleRoutes = visibleSpots.slice(0, -1).flatMap(({ item, index }, visibleIndex) => {
    const next = visibleSpots[visibleIndex + 1];
    return next?.index === index + 1 ? [{ origin: item.spot, destination: next.item.spot, mode: next.item.transportMode ?? 'DRIVING' as TransportMode, departureTime: schedule[index]?.departure }] : [];
  });
  if (!plan) return null;
  const selectedDayPlan = { ...plan, spots: visibleSpots.map(({ item }) => item), routes: visibleRoutes.map((_, index) => plan.routes[visibleSpots[index].index]) };
  const { visitMinutes, travelMinutes, estimatedCost: cost, currency } = getItineraryTotals(selectedDayPlan);
  const deleteSpot = (id: string) => { if (!plan) return; setUndoPlan(plan); setSaved(false); removeSpot(id); };
  const restoreDeletedSpot = () => { if (!undoPlan) return; setPlan(undoPlan); setUndoPlan(null); };
  const openSaveDialog = () => { setCourseTitleDraft(plan.title); setSaveError(''); setSaveDialogOpen(true); };
  const savePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const namedPlan = { ...plan, title: courseTitleDraft.trim() || plan.title };
    setSaving(true);
    setSaveComplete(false);
    setSaveError('');
    try {
      await save(namedPlan);
      setPlan(namedPlan);
      addSavedCourse(planToCourse(namedPlan));
      setSaveDialogOpen(false);
      setSaved(true);
      window.setTimeout(() => setSaveComplete(true), 1050);
      window.setTimeout(() => navigate('/mypage'), 2450);
    } catch (reason: unknown) {
      setSaving(false);
      setSaveError(reason instanceof Error ? reason.message : '여행 계획을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mapCol}>
            <TravelMap spots={[]} selected={visibleSpots.map(({ item }) => item.spot)} routes={visibleRoutes} />
          </div>
          <section className={styles.panel}>
            <div className="progress">TRAVEL PLAN</div>
            <h2>여행 계획을 검토해보세요</h2>
            <p className="hint">장소를 삭제하거나 순서를 바꾸고, 구간별 이동수단을 조정할 수 있습니다.</p>
            <label className={styles.daySelect}>일정 날짜<select value={activeDate} onChange={(event) => setSelectedDate(event.target.value)}>{planningDates.map((date) => <option key={date} value={date}>{date}</option>)}</select></label>
            <div className={styles.summary}>
              <strong>{visibleSpots.length}곳 · 총 {Math.floor((visitMinutes + travelMinutes) / 60)}시간 {(visitMinutes + travelMinutes) % 60}분</strong>
              <span>체류 {visitMinutes}분 · 이동 {travelMinutes}분 · 예상 비용 {formatRouteCost(cost, currency)}</span>
            </div>
            {warnings.length > 0 && <div className={styles.warnings} role="status"><strong>일정 확인이 필요합니다</strong>{warnings.map((warning) => <p key={`${warning.spotId}-${warning.kind}`}>{warning.message}</p>)}</div>}
            <ol className={styles.timeline}>
              {visibleSpots.map(({ item, index }, visibleIndex) => {
                const itemSchedule = schedule[index];
                const route = plan.routes[index];
                const mode = plan.spots[index + 1]?.transportMode ?? 'DRIVING';
                return (
                  <li key={item.spot.id} draggable onDragStart={() => setDraggedId(item.spot.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) reorderSpot(draggedId, index); setDraggedId(null); }} onDragEnd={() => setDraggedId(null)} aria-grabbed={draggedId === item.spot.id}>
                      <div className={styles.ticket}>
                      <div className={styles.dragTools}>
                        <div className={styles.dragHandle} aria-label="드래그하여 방문 순서 변경">⠿</div>
                        <button type="button" className={styles.deleteButton} aria-label={`${item.spot.name} 삭제`} title="관광지 삭제" onClick={() => deleteSpot(item.spot.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                      </div>
                      <div className={styles.index}>{index + 1}</div>
                      <div className={styles.thumb}>{item.spot.photoUrl ? <img src={item.spot.photoUrl} alt="" /> : item.spot.name.trim().charAt(0)}</div>
                      <div className={styles.ticketBody}>
                        <strong>{item.travelDate ?? plan.travelDate} · {item.spot.name}</strong>
                        <span>{item.spot.region} · {item.spot.feeAmount ? `${item.spot.feeAmount.toLocaleString()}원` : item.spot.feeNote} · {item.spot.durationMinutes}분</span>
                        <small>{itemSchedule?.arrival.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 도착 예상</small>
                      </div>
                    </div>
                    {visibleIndex < visibleSpots.length - 1 && visibleSpots[visibleIndex + 1].index === index + 1 && (
                      <div className={styles.leg}>
                        <label className={styles.transport}><span className={styles.transportTitle}>{transportIcon(mode, route?.transitDetails)}</span>
                          <select value={mode} onChange={(event) => { const nextMode = event.target.value as TransportMode; setTransport(index, nextMode); setRoute(index, null); }}>{Object.entries(transportLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                        </label>
                        <span className={styles.legInfo}>{route ? (route.error ? route.error : `${route.durationMinutes}분 · ${(route.distanceMeters / 1000).toFixed(1)}km${route.transitDetails ? ` · ${route.transitDetails}` : ''}${route.cost !== null && route.costNote ? ` · ${formatRouteCost(route.cost, route.costCurrency)}` : ''}`) : '경로 계산 중'}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => navigate('/recommendations')}>계획 수정</Button>
              <Button type="button" onClick={openSaveDialog}>저장</Button>
              <Button variant="secondary" type="button" onClick={() => { setPlan(null); navigate('/'); }}>새 여행 계획</Button>
            </div>
            {saved && <p className={styles.saved} role="status">여행 계획을 저장했어요. <Link to="/mypage">마이페이지에서 보기</Link></p>}
            {undoPlan && <div className={styles.undoMessage} role="status" aria-live="polite">관광지를 삭제했어요. <button type="button" onClick={restoreDeletedSpot}>복구</button></div>}
            {saveDialogOpen && <div className={styles.modalBackdrop} role="presentation"><form className={styles.saveDialog} role="dialog" aria-modal="true" aria-labelledby="save-dialog-title" onSubmit={savePlan}><h3 id="save-dialog-title">여행 계획 저장</h3><label htmlFor="course-title">계획 이름</label><input id="course-title" value={courseTitleDraft} onChange={(event) => setCourseTitleDraft(event.target.value)} autoFocus maxLength={60} />{saveError && <div className={styles.warnings} role="alert"><strong>저장하지 못했습니다</strong><p>{saveError}</p></div>}<div className={styles.dialogActions}><Button variant="secondary" type="button" onClick={() => setSaveDialogOpen(false)} disabled={saving}>취소</Button><Button type="submit" disabled={saving}>{saving ? '저장 중...' : '저장'}</Button></div></form></div>}
          </section>
        </div>
      </PageContainer>
      {saving && <div className={styles.saveOverlay} role="status" aria-live="polite">
        <div className={`${styles.saveOrb} ${saveComplete ? styles.saveOrbComplete : ''}`}>
          <div className={styles.saveOrbCore}>{saveComplete ? '✓' : '✦'}</div>
        </div>
        <strong>{saveComplete ? '저장 완료!' : '여행 코스 저장 중...'}</strong>
        <span>{saveComplete ? '마이페이지로 이동할게요' : '잠깐만 기다려주세요'}</span>
      </div>}
    </>
  );
}
