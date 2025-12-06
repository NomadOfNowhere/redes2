export type SortOption = 'alphabetical' | 'genre';

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: string;
  genre: string;
}