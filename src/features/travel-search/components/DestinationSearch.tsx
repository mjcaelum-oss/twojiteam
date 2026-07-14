import { useState } from 'react';
import { regions } from '../../../data/mock/regions';
import type { Destination } from '../../../types/travelPlan';
import type { DestinationSearchProps } from '../travelSearch.types';
import styles from './DestinationSearch.module.css';

// 자유 텍스트를 mock 지역 좌표로 매칭(정식 지오코딩은 추후). 좌표가 있어야 Google Places/지도가 동작합니다.
const regionKeywords: Record<string, string[]> = {
  seoul: ['서울'], busan: ['부산'], gangwon: ['강원', '강릉', '속초', '평창', '정동진'],
  jeonbuk: ['전북', '전주', '완주', '정읍', '남원', '부안'],
  jeonnam: ['전남', '여수', '순천', '담양', '목포', '보성'],
  jeju: ['제주', '서귀포']
};
function resolveDestination(text: string): Destination | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const region = regions.find((item) => regionKeywords[item.id]?.some((keyword) => trimmed.includes(keyword)));
  return region ? { name: trimmed, latitude: region.latitude, longitude: region.longitude } : null;
}

export function DestinationSearch({ value, onChange }: DestinationSearchProps) {
  const [text, setText] = useState(value);
  const resolved = resolveDestination(text);
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="destination-input">지역</label>
      <input
        id="destination-input"
        className={styles.input}
        type="text"
        value={text}
        placeholder="가고 싶은 지역을 입력해주세요 (예: 부산, 여수, 제주)"
        onChange={(event) => { setText(event.target.value); onChange(resolveDestination(event.target.value)); }}
      />
      <p className={styles.hint}>{text.trim() && !resolved ? '아직 지원하지 않는 지역이에요. 서울·부산·강원·전북·전남·제주 인근으로 입력해주세요.' : '입력한 지역 인근의 관광지를 추천해드려요.'}</p>
    </div>
  );
}
