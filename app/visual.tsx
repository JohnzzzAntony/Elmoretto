const visualPath = (name: string, width: 960 | 1920 | 3840 = 1920) =>
  `/cinema/${name}-${width}.webp`;

type VisualProps = {
  name: string;
  alt?: string;
  priority?: boolean;
  cinematic?: boolean;
};

export function Visual({ name, alt = "", priority = false, cinematic = false }: VisualProps) {
  return (
    <picture>
      {cinematic && <source media="(max-width: 767px) and (orientation: portrait)" srcSet={`/cinema/${name}-portrait.webp`} />}
      <img
        src={visualPath(name)}
        srcSet={`${visualPath(name, 960)} 960w, ${visualPath(name)} 1920w, ${visualPath(name, 3840)} 3840w`}
        sizes={cinematic ? "110vw" : "(max-width: 767px) 90vw, 48vw"}
        alt={alt}
        width="3840"
        height="2160"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
