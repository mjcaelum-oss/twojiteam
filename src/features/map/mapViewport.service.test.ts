import { describe, expect, it, vi } from 'vitest';

import type { Spot } from '../../types/spot';
import { fitMapToSpots } from './mapViewport.service';

function spot(id: string, latitude: number, longitude: number): Spot {
  return {
    id,
    name: id,
    region: '서울',
    latitude,
    longitude,
    category: 'culture',
    tags: [],
    description: '',
    feeAmount: 0,
    feeNote: '',
    durationMinutes: 90,
    openingHours: { weekly: {} },
    popularity: 0.8,
    source: 'places',
  };
}

function mapDouble() {
  return {
    fitBounds: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
  };
}

describe('fitMapToSpots', () => {
  it('여러 후보가 모두 보이도록 지도 범위를 맞춘다', () => {
    const map = mapDouble();

    fitMapToSpots(map as unknown as google.maps.Map, [
      spot('north-west', 37.6, 126.9),
      spot('south-east', 37.4, 127.2),
    ]);

    expect(map.fitBounds).toHaveBeenCalledWith({
      north: 37.6,
      south: 37.4,
      east: 127.2,
      west: 126.9,
    }, 48);
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
  });

  it('후보가 하나면 해당 장소로 이동해 적절히 확대한다', () => {
    const map = mapDouble();
    const onlySpot = spot('only', 37.5796, 126.977);

    fitMapToSpots(map as unknown as google.maps.Map, [onlySpot]);

    expect(map.setCenter).toHaveBeenCalledWith({ lat: 37.5796, lng: 126.977 });
    expect(map.setZoom).toHaveBeenCalledWith(14);
    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  it('여러 후보가 같은 좌표에 있으면 과도하게 확대하지 않는다', () => {
    const map = mapDouble();

    fitMapToSpots(map as unknown as google.maps.Map, [
      spot('first', 37.5796, 126.977),
      spot('second', 37.5796, 126.977),
    ]);

    expect(map.setCenter).toHaveBeenCalledWith({ lat: 37.5796, lng: 126.977 });
    expect(map.setZoom).toHaveBeenCalledWith(14);
    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  it('후보가 없으면 기존 지도 범위를 유지한다', () => {
    const map = mapDouble();

    fitMapToSpots(map as unknown as google.maps.Map, []);

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
  });
});
