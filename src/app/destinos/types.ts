export type StudioValues = Record<string, unknown>;

export type StudioEntry = {
  id: string;
  type: string;
  handle: string;
  values: StudioValues;
  media: Record<string, string>;
  updatedAt?: string;
};

export type StudioData = {
  settings: StudioEntry;
  hero: StudioEntry;
  experiences: StudioEntry[];
  sections: StudioEntry[];
  faqs: StudioEntry[];
  form: StudioEntry;
  reviews: StudioEntry;
  seo: StudioEntry;
  revisions: StudioEntry[];
};

export type GoogleReview = {
  id: string;
  authorName: string;
  authorUri: string;
  authorPhotoUri: string;
  rating: number;
  text: string;
  originalText: string;
  translated: boolean;
  relativePublishTime: string;
  publishTime: string;
  googleMapsUri: string;
  flagContentUri: string;
  visitDate: string;
};

export type GoogleReviewsState =
  | {
      status: "ready";
      placeId: string;
      placeName: string;
      googleMapsUri: string;
      rating: number;
      userRatingCount: number;
      reviews: GoogleReview[];
      minimumRating: number;
      maxReviews: number;
    }
  | {
      status: "unavailable";
      profileUrl: string;
    };
