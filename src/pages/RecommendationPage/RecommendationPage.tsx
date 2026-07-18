import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Button } from '../../components/common/Button/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import { TravelMap } from '../../features/map/components/TravelMap';
import { getSpotColor } from '../../features/map/spotColors';
import { RecommendationCard } from '../../features/recommendations/components/RecommendationCard';
import type { ScoredSpot } from '../../features/recommendations/recommendation.types';
import { getSpots } from '../../features/recommendations/recommendation.service';
import { openAIRecommendationsToSpots, requestOpenAIRecommendations } from '../../services/openai/openaiRecommendation.service';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import { loadGoogleMaps } from '../../features/map/googleMaps.loader';
import { NEARBY_ROUTE_UNAVAILABLE, requestRoute } from '../../features/routes/route.service';
import { formatRouteCost } from '../../features/routes/routeCost.utils';
import type { CalculatedRoute } from '../../features/routes/route.service';
import { buildSchedule } from '../../features/schedule-validation/scheduleValidation.service';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { LIKED_KEY, seedLikedSpots, toggleLikedSpot } from '../../features/favorites/favorites.store';
import type { LikedSpot } from '../../features/favorites/favorites.store';
import { transportLabels } from '../../data/constants/travel.constants';
import type { TransportMode } from '../../types/travelPlan';
import styles from './RecommendationPage.module.css';

export function RecommendationPage() {
  const navigate = useNavigate(); const { plan, addSpot, setDayStartTime, setTransport, setRoute } = useTravelPlan(); const [candidates, setCandidates] = useState<ScoredSpot[]>([]); const [rejected, setRejected] = useState<string[]>([]); const [current, setCurrent] = useState<ScoredSpot | undefined>(); const [routeOptions, setRouteOptions] = useState<Partial<Record<TransportMode, CalculatedRoute>>>({}); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [activeDate, setActiveDate] = useState(''); const [dayStartDraft, setDayStartDraft] = useState('09:00');
  const [liked, setLiked] = useLocalStorage<LikedSpot[]>(LIKED_KEY, seedLikedSpots);
  const toggleLike = (spot: ScoredSpot) => setLiked((list) => toggleLikedSpot(list, { id: spot.id, name: spot.name, region: spot.region }));
  const refreshCandidates = () => { setRejected((ids) => [...new Set([...ids, ...candidates.map((spot) => spot.id)])]); setCandidates([]); setCurrent(undefined); };
  const planningDates = useMemo(() => { if (!plan) return []; const start = new Date(`${plan.travelDate}T00:00:00`); const end = new Date(`${plan.returnDate ?? plan.travelDate}T00:00:00`); const dates: string[] = []; for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`); return dates; }, [plan]);
  const selectedDate = planningDates.includes(activeDate) ? activeDate : planningDates[0];
  const daySpots = plan?.spots.filter((item) => (item.travelDate ?? plan.travelDate) === selectedDate) ?? [];
  const lastDaySpot = daySpots.at(-1);
  const lastDayIndex = plan ? plan.spots.indexOf(lastDaySpot as typeof plan.spots[number]) : -1;
  const choose = (spot: ScoredSpot) => { setCurrent(spot); addSpot(spot, selectedDate); };
  const legIndex = daySpots.length > 1 ? lastDayIndex - 1 : -1;
  const origin = legIndex >= 0 && plan ? plan.spots[legIndex].spot : undefined;
  const destination = legIndex >= 0 && plan ? plan.spots[legIndex + 1].spot : undefined;
  const mode = legIndex >= 0 && plan ? plan.spots[legIndex + 1].transportMode ?? 'DRIVING' : 'DRIVING';
  const awaitingTransport = Boolean(plan && legIndex >= 0 && !plan.routes[legIndex]);
  const departureTime = plan && legIndex >= 0 ? buildSchedule(plan)[legIndex]?.departure : undefined;
  const recommendationTime = plan && lastDayIndex >= 0 ? buildSchedule(plan)[lastDayIndex]?.departure.toTimeString().slice(0, 5) : plan?.dayStartTimes?.[selectedDate] ?? plan?.startTime;
  const dayNumber = Math.max(1, planningDates.indexOf(selectedDate) + 1);
  const groupedSpots = planningDates.map((date, index) => ({ date, dayNumber: index + 1, spots: plan?.spots.filter((item) => (item.travelDate ?? plan.travelDate) === date) ?? [] }));
  useEffect(() => { if (!plan) { navigate('/'); return; } if (awaitingTransport || !plan.dayStartTimes?.[selectedDate]) return; let active = true; setLoading(true); setError(''); void getSpots(plan.destination).then(async (spots) => { const response = await requestOpenAIRecommendations({ destination: plan.destination, preferences: plan.preferences, spots, selectedIds: plan.spots.map((item) => item.spot.id), rejectedIds: rejected, previousSpotId: lastDaySpot?.spot.id, previousVenueType: lastDaySpot?.spot.venueType, recommendationDate: selectedDate, recommendationTime }); if (active) setCandidates(openAIRecommendationsToSpots(response, spots)); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'OpenAI 추천에 실패했습니다.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [navigate, plan, awaitingTransport, rejected, selectedDate, lastDaySpot?.spot.id, lastDaySpot?.spot.venueType, recommendationTime]);
  useEffect(() => {
    if (!plan || !origin || !destination) return;
    let active = true;
    setRouteOptions({});
    void loadGoogleMaps().then(() => Promise.all((Object.keys(transportLabels) as TransportMode[]).map((transport) => requestRoute(origin, destination, transport, departureTime)))).then((routes) => {
      if (!active) return;
      const options = Object.fromEntries((Object.keys(transportLabels) as TransportMode[]).map((transport, index) => [transport, routes[index]])) as Record<TransportMode, CalculatedRoute>;
      setRouteOptions(options);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '이동 경로를 계산하지 못했습니다.'); });
    return () => { active = false; };
  // The plan object changes when the calculated route is stored; stable leg ids prevent a request loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, legIndex, origin?.id, destination?.id, departureTime?.getTime()]);
  const chooseTransport = (transport: TransportMode) => { const route = routeOptions[transport]; if (legIndex < 0 || !route || route.summary.error) return; setTransport(legIndex, transport); setRoute(legIndex, route.summary); };
  const mapColors = useMemo(() => new Map([...plan?.spots.map((item) => item.spot) ?? [], ...candidates].map((spot, index) => [spot.id, getSpotColor(index)])), [plan?.spots, candidates]);
  const mapRoutes = plan ? plan.spots.slice(0, -1).filter((item, index) => (item.travelDate ?? plan.travelDate) === selectedDate && (plan.spots[index + 1].travelDate ?? plan.travelDate) === selectedDate).map((item) => { const index = plan.spots.indexOf(item); return { origin: item.spot, destination: plan.spots[index + 1].spot, mode: plan.spots[index + 1].transportMode ?? 'DRIVING' as TransportMode, departureTime: buildSchedule(plan)[index]?.departure, result: index === legIndex ? routeOptions[mode]?.result : undefined }; }).filter((_, index) => index !== legIndex || !awaitingTransport) : [];
  if (!plan) return null;
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mapCol}>
            <TravelMap spots={awaitingTransport || !plan.dayStartTimes?.[selectedDate] ? [] : candidates} selected={plan.spots.filter((item) => (item.travelDate ?? plan.travelDate) === selectedDate).map((item) => item.spot)} current={current} routes={mapRoutes} onError={setError} />
          </div>
          <section className={styles.panel} aria-live="polite">
            {error && <ErrorMessage message={error} />}
            <div className={styles.topActions}><Button variant="secondary" type="button" onClick={() => navigate('/')}>처음부터</Button></div>
            <div className={styles.dayTabs} role="tablist">{planningDates.map((date) => <button key={date} type="button" role="tab" aria-selected={selectedDate === date} className={selectedDate === date ? styles.dayTabActive : styles.dayTab} onClick={() => { setActiveDate(date); setDayStartDraft(plan.dayStartTimes?.[date] ?? '09:00'); setCurrent(undefined); }}>{new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}</button>)}</div>
            {awaitingTransport ? <>
              <div className="progress">{dayNumber}일차 {daySpots.length}번째 이동수단 선택</div>
              <h2>어떻게 이동할까요?</h2>
              <p className="hint">이동수단을 선택하면 다음 관광지 선택 단계로 이동합니다.</p>
              {origin && destination && <div className={styles.transportChoice}>
                <h3>{origin.name}에서 {destination.name}까지 이동</h3>
                <p className="hint">이동수단을 선택하면 해당 경로가 지도에 표시됩니다.</p>
                {Object.values(routeOptions).some((route) => route?.summary.error === NEARBY_ROUTE_UNAVAILABLE) && <p className="hint">두 장소가 100m 이내로 가까워 자동차·대중교통 경로가 제공되지 않습니다. 도보를 이용해주세요.</p>}
                <div className={styles.transportOptions}>
                  {(Object.keys(transportLabels) as TransportMode[]).map((transport) => {
                    const route = routeOptions[transport];
                    return <button key={transport} type="button" className={`${styles.transportOption} ${mode === transport ? styles.transportSelected : ''}`} onClick={() => chooseTransport(transport)} disabled={!route || Boolean(route.summary.error)} aria-pressed={mode === transport}>
                      <strong>{transportLabels[transport]}</strong>
                      <span>{route?.summary.error === NEARBY_ROUTE_UNAVAILABLE ? '거리가 가까워 경로 안내 불가' : route?.summary.error ? `경로 계산 실패: ${route.summary.error}` : route ? `${route.summary.durationMinutes}분${route.summary.cost !== null && route.summary.costNote ? ` · ${formatRouteCost(route.summary.cost, route.summary.costCurrency)}` : ''}` : '계산 중...'}</span>
                      {route?.summary.error === NEARBY_ROUTE_UNAVAILABLE ? <small>가까운 장소는 이 이동수단을 안내하지 않습니다.</small> : route?.summary.transitDetails ? <small>{route.summary.transitDetails}</small> : transport !== 'TRANSIT' && route?.summary.costNote && <small>{route.summary.costNote}</small>}
                    </button>;
                  })}
                </div>
              </div>}
            </> : !plan.dayStartTimes?.[selectedDate] ? <>
              <div className={styles.dayStartChoice}>
                <h3>{dayNumber}일차 일정 시작 시간</h3>
                <p className="hint">이 날짜의 첫 관광지 방문 시간을 정해주세요.</p>
                <input type="time" value={dayStartDraft} onChange={(event) => setDayStartDraft(event.target.value)} />
                <Button type="button" onClick={() => setDayStartTime(selectedDate, dayStartDraft)}>이 시간으로 시작</Button>
              </div>
            </> : <>
              <div className="progress">{dayNumber}일차 {daySpots.length + 1}번째 관광지 추천</div>
              <h2>{plan.destination.name}에서 어디가 좋을까요?</h2>
              <p className="hint">관광지를 선택하면 이동수단을 고른 뒤 다음 관광지 후보를 보여드립니다. 원할 때 계획 수립을 완료할 수 있습니다.</p>
              <p className="hint">Google Places 후보를 GPT agent가 취향과 이동 조건에 맞춰 골라드립니다.</p>
              <div className={styles.refreshRow}><Button variant="secondary" type="button" onClick={refreshCandidates} disabled={loading || !candidates.length}>후보 새로고침</Button></div>
              {loading ? <div className="loading">다음 관광지 후보를 준비하는 중입니다.</div> : (
                <div className={styles.cards}>
                  {candidates.length ? candidates.map((spot) => <RecommendationCard key={spot.id} spot={spot} selected={current?.id === spot.id} mapColor={mapColors.get(spot.id)} liked={liked.some((item) => item.id === spot.id)} onSelect={() => choose(spot)} onToggleLike={() => toggleLike(spot)} />) : <div className="complete">추천 후보가 없습니다. API 설정과 검색 반경을 확인하세요.</div>}
                </div>
              )}
            </>}
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => navigate('/')}>처음부터</Button>
              <Button type="button" disabled={!plan.spots.length || awaitingTransport} onClick={() => navigate('/review')}>계획 수립 완료</Button>
            </div>
            <div className={styles.selected}>
              <div className={styles.selectedHeader}><div><span className={styles.selectedEyebrow}>MY ITINERARY</span><h3>내 여행 목록</h3></div><span className={styles.selectedCount}>{plan.spots.length}곳</span></div>
              {plan.spots.length ? <div className={styles.dayPlans}>{groupedSpots.map(({ date, dayNumber: planDayNumber, spots }) => <div key={date} className={`${styles.dayPlan} ${date === selectedDate ? styles.dayPlanActive : ''} ${!spots.length ? styles.dayPlanEmpty : ''}`}>
                <div className={styles.dayPlanHeader}><span className={styles.dayNumber}>DAY {String(planDayNumber).padStart(2, '0')}</span><span>{date}</span><strong>{spots.length}곳</strong></div>
                {spots.length ? <ol>{spots.map((item, index) => <li key={item.spot.id}><span className={styles.selectedOrder}>{index + 1}</span><span className={styles.selectedThumb}>{item.spot.photoUrl ? <img src={item.spot.photoUrl} alt="" /> : item.spot.name.trim().charAt(0)}</span><span className={styles.selectedName}>{item.spot.name}</span>{index < spots.length - 1 && <span className={styles.selectedArrow}>›</span>}</li>)}</ol> : <p>아직 선택한 장소가 없습니다.</p>}
              </div>)}</div> : <div className={styles.selectedEmpty}><span className={styles.emptyIcon}>＋</span><p>아직 선택한 장소가 없습니다.</p><small>추천 카드에서 장소를 선택하면 여기에 일정이 쌓입니다.</small></div>}
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}



