import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Button } from '../../components/common/Button/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import { TravelMap } from '../../features/map/components/TravelMap';
import { RecommendationCard } from '../../features/recommendations/components/RecommendationCard';
import type { ScoredSpot } from '../../features/recommendations/recommendation.types';
import { getSpots } from '../../features/recommendations/recommendation.service';
import { openAIRecommendationsToSpots, requestOpenAIRecommendations } from '../../services/openai/openaiRecommendation.service';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import styles from './RecommendationPage.module.css';

export function RecommendationPage() {
  const navigate = useNavigate(); const { plan, addSpot } = useTravelPlan(); const [candidates, setCandidates] = useState<ScoredSpot[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (!plan) { navigate('/'); return; } let active = true; setLoading(true); setError(''); void getSpots(plan.destination).then(async (spots) => { const response = await requestOpenAIRecommendations({ destination: plan.destination, preferences: plan.preferences, spots, selectedIds: plan.spots.map((item) => item.spot.id), rejectedIds: [], previousSpotId: plan.spots.at(-1)?.spot.id }); if (active) setCandidates(openAIRecommendationsToSpots(response, spots)); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'OpenAI 추천에 실패했습니다.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [navigate, plan]);
  const choose = (spot: ScoredSpot) => addSpot(spot);
  if (!plan) return null;
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mapCol}>
            <TravelMap spots={candidates} selected={plan.spots.map((item) => item.spot)} onError={setError} />
          </div>
          <section className={styles.panel} aria-live="polite">
            <div className="progress">{plan.spots.length + 1}번째 추천</div>
            <h2>{plan.destination.name}에서 어디가 좋을까요?</h2>
            <p className="hint">Google Places 후보를 GPT agent가 취향과 이동 조건에 맞춰 골라드립니다.</p>
            {error && <ErrorMessage message={error} />}
            {loading ? <div className="loading">관광지 후보를 찾고 추천하는 중입니다.</div> : (
              <div className={styles.cards}>
                {candidates.length ? candidates.map((spot) => <RecommendationCard key={spot.id} spot={spot} onSelect={() => choose(spot)} />) : <div className="complete">추천 후보가 없습니다. API 설정과 검색 반경을 확인하세요.</div>}
              </div>
            )}
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => navigate('/')}>처음부터</Button>
              <Button variant="secondary" type="button" disabled={!plan.spots.length} onClick={() => navigate('/review')}>계획 검토</Button>
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
