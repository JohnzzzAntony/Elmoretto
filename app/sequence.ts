// Scroll units shared by the two films and the curtain.
export const TOTAL = 100;
export const ORIGIN_CAPTION = 5;
export const CURTAIN = { start: 56, end: 63 };

// Scroll-scrubbed frames in public/frames. 182 and 253 are cuts in the first clip; 301–420 is the truck clip.
export const frameRanges: Partial<Record<string, readonly [number, number]>> = {
  origin: [1, 95], cherry: [96, 181], harvest: [182, 252], drum: [253, 300], journey: [301, 420],
};
// Chapters that continue the previous chapter's camera move, so they join without a cross-fade.
export const seamless: readonly string[] = ["cherry"];

export const chapters = [
  {
    id: "origin", film: "harvest", label: "The origin", at: 0, visual: "mountain",
    kicker: "Highland estate", title: ["Mist, altitude,", "patience."],
    copy: "Volcanic soil and cool mornings slow the cherry down. Slow fruit is sweet fruit.",
  },
  {
    id: "cherry", film: "harvest", label: "The cherry", at: 13, visual: "cherry",
    kicker: "On the branch", title: ["Ripeness is", "everything."],
    copy: "Deep red, heavy with sugar. Only then is a cherry ready to leave the tree.",
  },
  {
    id: "harvest", film: "harvest", label: "The harvest", at: 21, visual: "harvest",
    kicker: "Picked by hand", title: ["One cherry", "at a time."],
    copy: "Gathered into a wooden bowl, the ripest fruit moves on. The rest waits its turn.",
  },
  {
    id: "drum", film: "harvest", label: "The green bean", at: 29, visual: "drum",
    kicker: "Washed and dried", title: ["Green, and", "ready."],
    copy: "Pulped, washed and sun-dried, the green beans settle into burlap, waiting for the roaster.",
  },
  {
    id: "journey", film: "harvest", label: "The journey", at: 36, visual: "drum",
    kicker: "Down the valley", title: ["From the farm", "to the roastery."],
    copy: "Loaded by hand and driven down the mountain road to our roastery, where the drum is already warm.",
  },
  {
    id: "roast", film: "harvest", label: "The roast", at: 46, visual: "roast",
    kicker: "Fire and timing", title: ["Roasted to", "the edge."],
    copy: "Heat wakes the sugars. We stop the roast seconds before boldness turns to bitterness.",
  },
  {
    id: "products", film: "ritual", label: "The collection", at: CURTAIN.end, visual: "cup",
    kicker: "Roasted, packed, ready", title: ["Three blends,", "one ritual."],
    copy: "Every bean you just followed ends here: our signature blends, selected for aroma, flavour and freshness.",
  },
  {
    id: "bean", film: "ritual", label: "The bean", at: 73, visual: "bean",
    kicker: "The ritual begins", title: ["Wake the", "beans."],
    copy: "Grind just before you brew. The first crack of the bean is where the aroma lives.",
  },
  {
    id: "bloom", film: "ritual", label: "The bloom", at: 79, visual: "bloom",
    kicker: "The first pour", title: ["Let it", "bloom."],
    copy: "A little hot water opens up the grounds. Pause, let them breathe, then keep pouring.",
  },
  {
    id: "pour", film: "ritual", label: "The pour", at: 85, visual: "pour",
    kicker: "The fall", title: ["Sip the", "unexpected."],
    copy: "The carafe tips, the coffee falls, and ripples spread across the cup.",
  },
  {
    id: "cup", film: "ritual", label: "The cup", at: 91, visual: "cup",
    kicker: "The finish", title: ["Make time", "taste better."],
    copy: "Warm the cup. Take in the aroma. Give the first sip a moment of its own.",
  },
] as const;

