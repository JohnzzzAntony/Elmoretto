// Scroll units of the harvest film. The reel takes over on the home page once it ends.
export const TOTAL = 74;
export const ORIGIN_CAPTION = 5;

// Scroll-scrubbed frames in public/frames. 182 and 253 are cuts in the first clip; 301–420 is the truck clip;
// 421–672 is the roastery film, split at two of its cuts.
export const frameRanges: Record<string, readonly [number, number]> = {
  origin: [1, 95], cherry: [96, 181], harvest: [182, 252], drum: [253, 300], journey: [301, 420],
  roast: [421, 508], grind: [509, 572], pour: [573, 672],
};
// Chapters that continue the previous chapter's camera move, so they join without a cross-fade.
export const seamless: readonly string[] = ["cherry", "grind", "pour"];
// The roastery film was shot at 1920 × 1080, so it has no 3840 set.
export const hdOnly: readonly string[] = ["roast", "grind", "pour"];

export const chapters = [
  {
    id: "origin", label: "The origin", at: 0,
    kicker: "Highland estate", title: ["Mist, altitude,", "patience."],
    copy: "Volcanic soil and cool mornings slow the cherry down. Slow fruit is sweet fruit.",
  },
  {
    id: "cherry", label: "The cherry", at: 13,
    kicker: "On the branch", title: ["Ripeness is", "everything."],
    copy: "Deep red, heavy with sugar. Only then is a cherry ready to leave the tree.",
  },
  {
    id: "harvest", label: "The harvest", at: 21,
    kicker: "Picked by hand", title: ["One cherry", "at a time."],
    copy: "Gathered into a wooden bowl, the ripest fruit moves on. The rest waits its turn.",
  },
  {
    id: "drum", label: "The green bean", at: 29,
    kicker: "Washed and dried", title: ["Green, and", "ready."],
    copy: "Pulped, washed and sun-dried, the green beans settle into burlap, waiting for the roaster.",
  },
  {
    id: "journey", label: "The journey", at: 36,
    kicker: "Down the valley", title: ["From the farm", "to the roastery."],
    copy: "Loaded by hand and driven down the mountain road to our roastery, where the drum is already warm.",
  },
  {
    id: "roast", label: "The roast", at: 47,
    kicker: "Fire and timing", title: ["Roasted to", "the edge."],
    copy: "Heat wakes the sugars. We stop the roast seconds before boldness turns to bitterness.",
  },
  {
    id: "grind", label: "The grind", at: 56,
    kicker: "Ground to order", title: ["Fresh, fine,", "fragrant."],
    copy: "Ground moments before brewing, then tamped level and firm.",
  },
  {
    id: "pour", label: "The pour", at: 63,
    kicker: "Behind the bar", title: ["Pulled, steamed,", "poured."],
    copy: "Espresso, silky milk and a steady hand. The cup is ready.",
  },
] as const;

