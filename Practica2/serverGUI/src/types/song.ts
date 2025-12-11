export type SortOption = 'alphabetical' | 'year';

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: string;
  year: string;
}