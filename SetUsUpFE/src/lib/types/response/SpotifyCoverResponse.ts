
export interface SpotifyCover {
  spotifySongId: string;
  coverUrl: string | null; // Spotify CDN url for the SMALLEST image (~64x64)
  wasUnlinked?: boolean; // true when the BE unlinked the Spotify-Song link
}

export type SpotifyCoverList = SpotifyCover[];
