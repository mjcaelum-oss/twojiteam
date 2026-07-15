export interface SpotColor { name: string; value: string; }
const colors: SpotColor[] = [
  { name: '파랑', value: '#2563eb' }, { name: '빨강', value: '#dc2626' }, { name: '초록', value: '#16a34a' },
  { name: '보라', value: '#7c3aed' }, { name: '주황', value: '#ea580c' }, { name: '청록', value: '#0891b2' },
  { name: '분홍', value: '#db2777' }, { name: '갈색', value: '#92400e' }, { name: '연두', value: '#65a30d' },
  { name: '남색', value: '#4338ca' }, { name: '회색', value: '#4b5563' }, { name: '금색', value: '#ca8a04' }
];

export function getSpotColor(index: number) {
  return colors[index % colors.length];
}
