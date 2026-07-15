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
  jeju: ['제주', '서귀포'],
  'new-york': ['뉴욕', 'New York', 'NYC'],
  tokyo: ['도쿄', 'Tokyo'],
  osaka: ['오사카', 'Osaka'],
  kyoto: ['교토', 'Kyoto'],
  'los-angeles': ['로스앤젤레스', 'Los Angeles', 'LA'],
  'san-francisco': ['샌프란시스코', 'San Francisco', 'SF'],
  paris: ['파리', 'Paris'],
  london: ['런던', 'London'],
  edinburgh: ['에든버러', 'Edinburgh'], manchester: ['맨체스터', 'Manchester'],
  liverpool: ['리버풀', 'Liverpool'], birmingham: ['버밍엄', 'Birmingham'],
  glasgow: ['글래스고', 'Glasgow'], bristol: ['브리스톨', 'Bristol'],
  oxford: ['옥스퍼드', 'Oxford'], cambridge: ['케임브리지', 'Cambridge'], bath: ['바스', 'Bath'],
  rome: ['로마', 'Rome'], barcelona: ['바르셀로나', 'Barcelona'], madrid: ['마드리드', 'Madrid'],
  amsterdam: ['암스테르담', 'Amsterdam'], berlin: ['베를린', 'Berlin'], vienna: ['빈', 'Vienna'],
  prague: ['프라하', 'Prague'], lisbon: ['리스본', 'Lisbon'], athens: ['아테네', 'Athens'],
  istanbul: ['이스탄불', 'Istanbul'], dubai: ['두바이', 'Dubai'], singapore: ['싱가포르', 'Singapore'],
  bangkok: ['방콕', 'Bangkok'], 'hong-kong': ['홍콩', 'Hong Kong'], bali: ['발리', 'Bali', 'Denpasar'],
  sydney: ['시드니', 'Sydney'], melbourne: ['멜버른', 'Melbourne'], auckland: ['오클랜드', 'Auckland'],
  toronto: ['토론토', 'Toronto'], vancouver: ['밴쿠버', 'Vancouver'], 'mexico-city': ['멕시코시티', 'Mexico City'],
  'rio-de-janeiro': ['리우데자네이루', 'Rio de Janeiro'], 'cape-town': ['케이프타운', 'Cape Town'],
  cairo: ['카이로', 'Cairo']
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
        placeholder="가고 싶은 지역을 입력해주세요 (예: 도쿄, 뉴욕, 파리)"
        onChange={(event) => { setText(event.target.value); onChange(resolveDestination(event.target.value)); }}
      />
      <p className={styles.hint}>{text.trim() && !resolved ? '아직 지원하지 않는 지역이에요. 국내 주요 지역, 영국 대표 도시와 세계 주요 여행지를 입력해주세요.' : '입력한 지역 인근의 관광지를 추천해드려요.'}</p>
    </div>
  );
}
