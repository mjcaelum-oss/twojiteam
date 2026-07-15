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
import { requestRoute } from '../../features/routes/route.service';
import type { CalculatedRoute } from '../../features/routes/route.service';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { LIKED_KEY, seedLikedSpots, toggleLikedSpot } from '../../features/favorites/favorites.store';
import type { LikedSpot } from '../../features/favorites/favorites.store';
import { transportLabels } from '../../data/constants/travel.constants';
import type { TransportMode } from '../../types/travelPlan';
import styles from './RecommendationPage.module.css';

export function RecommendationPage() {
  const navigate = useNavigate(); const { plan, addSpot, setTransport, setRoute } = useTravelPlan(); const [candidates, setCandidates] = useState<ScoredSpot[]>([]); const [rejected, setRejected] = useState<string[]>([]); const [current, setCurrent] = useState<ScoredSpot | undefined>(); const [routeOptions, setRouteOptions] = useState<Partial<Record<TransportMode, CalculatedRoute>>>({}); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useLocalStorage<LikedSpot[]>(LIKED_KEY, seedLikedSpots);
  const toggleLike = (spot: ScoredSpot) => setLiked((list) => toggleLikedSpot(list, { id: spot.id, name: spot.name, region: spot.region }));
  const choose = (spot: ScoredSpot) => { setCurrent(spot); addSpot(spot); };
  const reject = (spot: ScoredSpot) => { setRejected((ids) => ids.includes(spot.id) ? ids : [...ids, spot.id]); if (current?.id === spot.id) setCurrent(undefined); };
  const legIndex = plan ? plan.spots.length - 2 : -1;
  const origin = legIndex >= 0 && plan ? plan.spots[legIndex].spot : undefined;
  const destination = legIndex >= 0 && plan ? plan.spots[legIndex + 1].spot : undefined;
  const mode = legIndex >= 0 && plan ? plan.spots[legIndex + 1].transportMode ?? 'DRIVING' : 'DRIVING';
  const awaitingTransport = Boolean(plan && legIndex >= 0 && !plan.routes[legIndex]);
  useEffect(() => { if (!plan) { navigate('/'); return; } if (awaitingTransport) return; let active = true; setLoading(true); setError(''); void getSpots(plan.destination).then(async (spots) => { const response = await requestOpenAIRecommendations({ destination: plan.destination, preferences: plan.preferences, spots, selectedIds: plan.spots.map((item) => item.spot.id), rejectedIds: rejected, previousSpotId: plan.spots.at(-1)?.spot.id }); if (active) setCandidates(openAIRecommendationsToSpots(response, spots)); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'OpenAI 추천에 실패했습니다.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [navigate, plan, awaitingTransport, rejected]);
  useEffect(() => {
    if (!plan || !origin || !destination) return;
    let active = true;
    setRouteOptions({});
    void loadGoogleMaps().then(() => Promise.all((Object.keys(transportLabels) as TransportMode[]).map((transport) => requestRoute(origin, destination, transport)))).then((routes) => {
      if (!active) return;
      const options = Object.fromEntries((Object.keys(transportLabels) as TransportMode[]).map((transport, index) => [transport, routes[index]])) as Record<TransportMode, CalculatedRoute>;
      setRouteOptions(options);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '이동 경로를 계산하지 못했습니다.'); });
    return () => { active = false; };
  // The plan object changes when the calculated route is stored; stable leg ids prevent a request loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, legIndex, origin?.id, destination?.id]);
  const chooseTransport = (transport: TransportMode) => { const route = routeOptions[transport]; if (legIndex < 0 || !route || route.summary.error) return; setTransport(legIndex, transport); setRoute(legIndex, route.summary); };
  const selectedRoute = legIndex >= 0 && plan ? plan.routes[legIndex] : null;
  const mapColors = useMemo(() => new Map([...plan?.spots.map((item) => item.spot) ?? [], ...candidates].map((spot, index) => [spot.id, getSpotColor(index)])), [plan?.spots, candidates]);
  if (!plan) return null;
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mapCol}>
            <TravelMap spots={awaitingTransport ? [] : candidates} selected={plan.spots.map((item) => item.spot)} routes={origin && destination && selectedRoute && routeOptions[mode]?.result ? [{ origin, destination, mode, result: routeOptions[mode].result }] : []} onError={setError} />
          </div>
          <section className={styles.panel} aria-live="polite">
            {error && <ErrorMessage message={error} />}
            {awaitingTransport ? <>
              <div className="progress">{plan.spots.length}번째 이동수단 선택</div>
              <h2>어떻게 이동할까요?</h2>
              <p className="hint">이동수단을 선택하면 다음 관광지 선택 단계로 이동합니다.</p>
              {origin && destination && <div className={styles.transportChoice}>
                <h3>{origin.name}에서 {destination.name}까지 이동</h3>
                <p className="hint">이동수단을 선택하면 해당 경로가 지도에 표시됩니다.</p>
                <div className={styles.transportOptions}>
                  {(Object.keys(transportLabels) as TransportMode[]).map((transport) => {
                    const route = routeOptions[transport];
                    return <button key={transport} type="button" className={`${styles.transportOption} ${mode === transport ? styles.transportSelected : ''}`} onClick={() => chooseTransport(transport)} disabled={!route || Boolean(route.summary.error)} aria-pressed={mode === transport}>
                      <strong>{transportLabels[transport]}</strong>
                      <span>{route?.summary.error ? `경로 계산 실패: ${route.summary.error}` : route ? `${route.summary.durationMinutes}분 · ${route.summary.cost.toLocaleString()}원` : '계산 중...'}</span>
                      {route?.summary.costNote && <small>{route.summary.costNote}</small>}
                    </button>;
                  })}
                </div>
              </div>}
            </> : <>
              <div className="progress">{plan.spots.length + 1}번째 추천</div>
              <h2>{plan.destination.name}에서 어디가 좋을까요?</h2>
              <p className="hint">관광지를 선택하면 이동수단을 고른 뒤 다음 관광지 후보를 보여드립니다. 원할 때 계획 수립을 완료할 수 있습니다.</p>
              <p className="hint">Google Places 후보를 GPT agent가 취향과 이동 조건에 맞춰 골라드립니다.</p>
              {loading ? <div className="loading">다음 관광지 후보를 준비하는 중입니다.</div> : (
                <div className={styles.cards}>
                  {candidates.length ? candidates.map((spot) => <RecommendationCard key={spot.id} spot={spot} selected={current?.id === spot.id} mapColor={mapColors.get(spot.id)} liked={liked.some((item) => item.id === spot.id)} onSelect={() => choose(spot)} onReject={() => reject(spot)} onToggleLike={() => toggleLike(spot)} />) : <div className="complete">추천 후보가 없습니다. API 설정과 검색 반경을 확인하세요.</div>}
                </div>
              )}
            </>}
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => navigate('/')}>처음부터</Button>
              <Button type="button" disabled={!plan.spots.length || awaitingTransport} onClick={() => navigate('/review')}>계획 수립 완료</Button>
            </div>
            <div className={styles.selected}>
              <h3>내 여행 목록</h3>
              {plan.spots.length ? <ol>{plan.spots.map((item) => <li key={item.spot.id}>{item.spot.name}</li>)}</ol> : <p>아직 선택한 장소가 없습니다.</p>}
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
