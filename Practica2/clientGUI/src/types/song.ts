export type SortOption = 'alphabetical' | 'artist' | 'album' | 'year' | 'duration';

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: string;
  year: string;
  filepath: string;
}