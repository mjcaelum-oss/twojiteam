import { companionOptions, paceOptions, travelStyleOptions } from '../preference.constants';
import type { TravelPreferences } from '../../../types/travelPlan';
import styles from './TravelPreferenceForm.module.css';

export interface TravelPreferenceFormProps {
  preferences: TravelPreferences;
  date: string;
  startTime: string;
  partySize: number;
  onPreferencesChange: (value: TravelPreferences) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onPartySizeChange: (value: number) => void;
}

export function TravelPreferenceForm({ preferences, date, startTime, partySize, onPreferencesChange, onDateChange, onStartTimeChange, onPartySizeChange }: TravelPreferenceFormProps) {
  const paceIndex = Math.max(0, paceOptions.findIndex((option) => option.value === preferences.pace));
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
        <input className={styles.slider} type="range" min={0} max={paceOptions.length - 1} step={1} value={paceIndex} aria-label="여행 속도" onChange={(event) => onPreferencesChange({ ...preferences, pace: paceOptions[Number(event.target.value)].value })} />
        <div className={styles.sliderLabels}>{paceOptions.map((option, index) => <span key={option.value} className={index === paceIndex ? styles.active : ''}>{option.label}</span>)}</div>
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
    </div>
  );
}
