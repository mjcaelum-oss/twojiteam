import { companionOptions, paceOptions, travelStyleOptions } from '../preference.constants';
import type { TravelPreferences } from '../../../types/travelPlan';
import styles from './TravelPreferenceForm.module.css';

export interface TravelPreferenceFormProps {
  preferences: Partial<TravelPreferences>;
  date: string;
  startTime: string;
  partySize: number;
  onPreferencesChange: (value: Partial<TravelPreferences>) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onPartySizeChange: (value: number) => void;
}

export function TravelPreferenceForm({ preferences, date, startTime, partySize, onPreferencesChange, onDateChange, onStartTimeChange, onPartySizeChange }: TravelPreferenceFormProps) {
  return (
    <div className={styles.form}>
      <section className={styles.section}>
        <div className={styles.qtitle}><span className={styles.qnum}>1</span> 선호 관광 방식</div>
        <div className={styles.chips}>
          {travelStyleOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={preferences.style === option.value} className={`${styles.chip} ${preferences.style === option.value ? styles.selected : ''}`} onClick={() => onPreferencesChange({ ...preferences, style: option.value })}>{option.label}</button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.qtitle}><span className={styles.qnum}>2</span> 여행 속도</div>
        <div className={styles.chips}>
          {paceOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={preferences.pace === option.value} className={`${styles.chip} ${preferences.pace === option.value ? styles.selected : ''}`} onClick={() => onPreferencesChange({ ...preferences, pace: option.value })}>{option.label}</button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.qtitle}><span className={styles.qnum}>3</span> 동행 유형</div>
        <div className={styles.chips}>
          {companionOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={preferences.companion === option.value} className={`${styles.chip} ${preferences.companion === option.value ? styles.selected : ''}`} onClick={() => onPreferencesChange({ ...preferences, companion: option.value })}>{option.label}</button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.qtitle}><span className={styles.qnum}>4</span> 일정</div>
        <div className={styles.inline}>
          <label className={styles.field}>여행 날짜<input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} /></label>
          <label className={styles.field}>출발 시각<input type="time" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} /></label>
          <label className={styles.field}>인원수<input type="number" min={1} max={10} value={partySize} onChange={(event) => onPartySizeChange(Number(event.target.value))} /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.qtitle}><span className={styles.qnum}>5</span> 추가 여행 선호사항 <span className={styles.optional}>(선택)</span></div>
        <textarea className={styles.textarea} rows={3} value={preferences.notes ?? ''} onChange={(event) => onPreferencesChange({ ...preferences, notes: event.target.value })} placeholder="예: 조용한 곳 위주로, 사진 찍기 좋은 장소 선호 등 (선택 입력, 비워두고 넘어가도 됩니다)" />
      </section>
    </div>
  );
}
