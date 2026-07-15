const colors = [
  { name: '파랑', value: '#2563eb' },
  { name: '빨강', value: '#dc2626' },
  { name: '초록', value: '#16a34a' },
  { name: '보라', value: '#7c3aed' },
  { name: '주황', value: '#ea580c' },
  { name: '청록', value: '#0891b2' }
];

export function getSpotColor(id: string) {
  const hash = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
