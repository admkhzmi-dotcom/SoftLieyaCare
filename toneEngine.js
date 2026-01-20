export function buildTone(prefs={}, profile={}, modes={}){
  const name = (profile?.displayName || "Lieya").trim() || "Lieya";
  const level = Number(prefs?.toneLevel ?? 1);
  const tired = !!modes?.tiredModeEnabled;
  const period = !!modes?.periodModeEnabled;

  const base = {
    water: [
      `Tiny sparkle moment, ${name} — a few sips of water ✨`,
      `${name}, quick hydration… and you’re doing great.`,
      `Water check-in, ${name}. Small steps, big care.`
    ],
    meal: [
      `${name}, something simple counts. Proud of you for showing up.`,
      `A gentle meal is a win, ${name}. Take your time.`,
      `No pressure — just a few bites, ${name}. That’s enough.`
    ],
    rest: [
      `A calm pause is still progress, ${name}.`,
      `Breathe out slowly, ${name}. You’re safe here.`,
      `Let your shoulders soften, ${name}.`
    ],
    comfort: [
      `Hey ${name} — you’re doing better than you think 🌙`,
      `One step at a time, ${name}. I’m with you.`,
      `You deserve gentle days, ${name}.`
    ]
  };

  function tweak(line){
    if(level === 0) return line.replaceAll("✨","").replaceAll("🌙","");
    return line;
  }
  function overlay(line, category){
    if(tired && (category==="meal"||category==="rest"||category==="comfort")) return `${line} Slow is perfect today.`;
    if(period && (category==="meal"||category==="rest"||category==="comfort")) return `${line} Extra gentle mode today.`;
    return line;
  }
  function gentleLine(category){
    const arr = base[category] || base.comfort;
    const raw = arr[Math.floor(Math.random()*arr.length)];
    return tweak(overlay(raw, category));
  }

  return { gentleLine };
}
