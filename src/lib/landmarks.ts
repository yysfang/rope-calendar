import photos from '../data/landmarks.json' with { type: 'json' };

export type LandmarkPhoto = {
 key: string;
 place: string;
 title: string;
 kind: 'city' | 'sport';
 matches: string[];
 venues?: string[];
 src: string;
 mobileSrc: string;
 author: string;
 sourceUrl: string;
 license: string;
 licenseUrl: string;
 position: string;
 generated?: boolean;
};

export const landmarkPhotos = photos as LandmarkPhoto[];
const locations = new Map(landmarkPhotos.filter(photo => !photo.venues?.length).flatMap(photo => photo.matches.map(place => [place, photo] as const)));
const venuePhotos = landmarkPhotos.filter(photo => photo.venues?.length);
const sport = landmarkPhotos.find(photo => photo.kind === 'sport')!;

export function eventCover(event: { province: string; city: string; venue?: string }): LandmarkPhoto {
 // A province or an online event cannot establish a host city.
 if (!event.city || /线上|待定|待公布|各有关/.test(event.city)) return sport;
 const city = event.city.replace(/（.*?）/g, '').trim();
 const place = `${event.province}|${city}`;
 return venuePhotos.find(photo => photo.matches.includes(place) && photo.venues!.some(venue => event.venue?.includes(venue))) || locations.get(place) || sport;
}
