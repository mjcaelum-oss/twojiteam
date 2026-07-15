import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchTouristSpots } from './googlePlaces.service';

vi.mock('../../features/map/googleMaps.loader', () => ({
  loadGoogleMaps: vi.fn().mockResolvedValue(undefined),
}));

const searchNearby = vi.fn();

describe('searchTouristSpots', () => {
  beforeEach(() => {
    searchNearby.mockResolvedValue({
      places: [
        {
          id: 'palace-id',
          displayName: '경복궁',
          location: {
            lat: () => 37.5796,
            lng: () => 126.977,
          },
          formattedAddress: '서울특별시 종로구',
          googleMapsURI: 'https://maps.google.com/?cid=palace-id',
          types: ['historical_landmark'],
          photos: [{ getURI: () => 'https://images.example/palace.jpg' }],
          rating: 4.8,
        },
      ],
    });

    vi.stubGlobal('google', {
      maps: {
        importLibrary: vi.fn().mockResolvedValue({
          Place: { searchNearby },
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('현재 Places API 응답을 관광지 후보로 변환하고 최대 10개만 요청한다', async () => {
    const spots = await searchTouristSpots({
      name: '서울',
      latitude: 37.5665,
      longitude: 126.978,
    });

    expect(searchNearby).toHaveBeenCalledWith(expect.objectContaining({
      maxResultCount: 10,
    }));
    expect(spots).toHaveLength(1);
    expect(spots[0]).toMatchObject({
      id: 'place:palace-id',
      name: '경복궁',
      latitude: 37.5796,
      longitude: 126.977,
      category: 'culture',
      photoUrl: 'https://images.example/palace.jpg',
      source: 'places',
    });
  });
});
