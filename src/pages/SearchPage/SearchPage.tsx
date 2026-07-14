import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Button } from '../../components/common/Button/Button';
import type { TravelPreferences } from '../../types/travelPlan';
import { DestinationSearch } from '../../features/travel-search/components/DestinationSearch';
import { TravelPreferenceForm } from '../../features/travel-preferences/components/TravelPreferenceForm';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const navigate = useNavigate();
  const { setPlan } = useTravelPlan();
  const [destination, setDestination] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [preferences, setPreferences] = useState<TravelPreferences>({ style: 'culture', pace: 'slow', companion: 'couple' });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [partySize, setPartySize] = useState(2);
  const submit = () => {
    if (!destination) return;
    setPlan({ id: crypto.randomUUID(), title: `${destination.name} 여행 계획`, destination, travelDate: date, startTime, preferences, partySize, spots: [], routes: [], status: 'draft' });
    navigate('/recommendations');
  };
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <section className={styles.select}>
          <div className={styles.head}>
            <div className="eyebrow">START HERE</div>
            <h2>여행 취향을 알려주세요</h2>
            <p>취향과 지역을 고르면 Google Places 관광지를 찾아 GPT agent가 추천해드릴게요.</p>
          </div>
          <TravelPreferenceForm
            preferences={preferences}
            date={date}
            startTime={startTime}
            partySize={partySize}
            onPreferencesChange={setPreferences}
            onDateChange={setDate}
            onStartTimeChange={setStartTime}
            onPartySizeChange={setPartySize}
          />
          <DestinationSearch value={destination ? destination.name : ''} onChange={setDestination} />
          <div className={styles.submit}>
            <Button type="button" disabled={!destination} onClick={submit}>관광지 보기</Button>
          </div>
          <p className={styles.note}>지역 자동 매칭은 mock 좌표 기반이며, 관광지 데이터는 Google Places에서 실시간 조회합니다.</p>
        </section>
      </PageContainer>
    </>
  );
}
