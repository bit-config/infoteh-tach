export type StoryBlock =
  | { type: "text"; content: string; style?: "lead" | "quote" }
  | { type: "image"; src: string; caption?: string }
  | { type: "gallery"; images: { type?: "image" | "video"; src: string; caption?: string }[] };

export interface MapItem {
  id: string;
  title: string;
  category: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  info: StoryBlock[];
}

export interface MapData {
  title: string;
  subtitle: string;
  ImageFonMain: string;
  items: MapItem[];
}
