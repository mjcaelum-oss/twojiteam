import { searchTouristSpots } from '../../services/google/googlePlaces.service';
import type { Spot } from '../../types/spot';
import type { Destination } from '../../types/travelPlan';

export async function getSpots(destination: Destination): Promise<Spot[]> {
  return searchTouristSpots(destination);
}
