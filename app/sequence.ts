// Scroll units of the harvest film. The reel takes over on the home page once it ends.
export const TOTAL = 47;
export const ORIGIN_CAPTION = 5;

// Scroll-scrubbed frames in public/frames. 182 and 253 are cuts in the first clip; 301–420 is the truck clip.
export const frameRanges: Partial<Record<string, readonly [number, number]>> = {
  origin: [1, 95], cherry: [96, 181], harvest: [182, 252], drum: [253, 300], journey: [301, 420],
};
// Chapters that continue the previous chapter's camera move, so they join without a cross-fade.
export const seamless: readonly string[] = ["cherry"];

export const chapters = [
  {
    id: "origin", label: "The origin", at: 0, visual: "mountain",
    kicker: "Highland estate", title: ["Mist, altitude,", "patience."],
    copy: "Volcanic soil and cool mornings slow the cherry down. Slow fruit is sweet fruit.",
  },
  {
    id: "cherry", label: "The cherry", at: 13, visual: "cherry",
    kicker: "On the branch", title: ["Ripeness is", "everything."],
    copy: "Deep red, heavy with sugar. Only then is a cherry ready to leave the tree.",
  },
  {
    id: "harvest", label: "The harvest", at: 21, visual: "harvest",
    kicker: "Picked by hand", title: ["One cherry", "at a time."],
    copy: "Gathered into a wooden bowl, the ripest fruit moves on. The rest waits its turn.",
  },
  {
    id: "drum", label: "The green bean", at: 29, visual: "drum",
    kicker: "Washed and dried", title: ["Green, and", "ready."],
    copy: "Pulped, washed and sun-dried, the green beans settle into burlap, waiting for the roaster.",
  },
  {
    id: "journey", label: "The journey", at: 36, visual: "drum",
    kicker: "Down the valley", title: ["From the farm", "to the roastery."],
    copy: "Loaded by hand and driven down the mountain road to our roastery, where the drum is already warm.",
  },
] as const;

