export const scenes = [
  {
    id: "origin", label: "The Origin", visual: "mountain",
    story: "The journey opens among mist and tropical foliage. Coffee cherries take time to ripen on the branch, long before the beans ever meet the roaster.",
    alt: "Sunrise over green coffee terraces and mist between volcanic mountain ridges",
  },
  {
    id: "cherry", label: "The Coffee Cherry", visual: "cherry",
    story: "The coffee bean begins as a seed inside a cherry. As the fruit ripens, its skin changes color, offering a cue for pickers working their way through the trees.",
    alt: "Glossy red coffee cherries on the branch",
  },
  {
    id: "process", label: "The Harvest", visual: "harvest",
    story: "Selective picking lets growers gather ripe fruit and leave the rest to mature. The harvested cherries are sorted before they move into processing.",
    alt: "A grower gathering ripe red cherries into a woven basket",
  },
  {
    id: "processing", label: "The Transformation", visual: "drum",
    story: "The fruit and its seeds are separated and dried according to the processing method. Once dried and milled, the green coffee is ready to roast.",
    alt: "Green coffee beans falling into a steel drum roaster",
  },
  {
    id: "roast", label: "The Roast", visual: "roast",
    story: "Heat transforms green coffee. The beans darken and develop aroma as the roaster balances time and temperature, then cools them to bring the roast to a stop.",
    alt: "Freshly roasted coffee beans falling into a copper cooling tray",
  },
  {
    id: "brew", label: "The Perfect Brew", visual: "pour",
    story: "Freshly brewed coffee flows from the carafe into a warmed ceramic cup. The pour brings the aroma up just before the first sip.",
    alt: "A clear glass carafe pouring brewed coffee into a stoneware cup",
  },
  {
    id: "reveal", label: "The Final Reveal", visual: "cup",
    story: "The journey comes to rest in a warm cup. Take a moment to notice the aroma before the first sip.",
    alt: "A speckled stoneware cup with rosetta latte art",
  },
] as const;

export function chapterNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}
