function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export function buildTone(prefs, profile, modes){
  const name = (profile?.displayName || "Lieya").trim() || "Lieya";
  const level = Number(prefs?.toneLevel ?? 1);
  const tired = !!modes?.tiredModeEnabled;
  const period = !!modes?.periodModeEnabled;

  const base = {
    water: [
      `Hydrate a little, ${name}. Just a few sips.`,
      `Small reminder: water first, ${name}.`,
      `Take it easy—water helps, ${name}.`
    ],
    meal: [
      `${name}, something small is still good. A few bites is enough.`,
      `A simple meal is self-respect, ${name}.`,
      `When you’re ready—soft food, gentle pace.`
    ],
    sleep: [
      `Protect your rest tonight, ${name}.`,
      `Quiet mind, steady breath—rest is allowed.`,
      `Let the day soften. Sleep when you can, ${name}.`
    ],
    eyes: [
      `20 seconds: look far, blink slow, relax your shoulders.`,
      `Tiny reset—soft eyes, calm breath.`,
      `Slow blink, long exhale—good.`
    ],
    safety: [
      `Quick check: are you safe, ${name}? Tap “I’m okay”.`,
      `If anything feels off—choose safety first.`,
      `Trust your instinct, ${name}.`
    ],
    comfort: [
      `One step at a time, ${name}.`,
      `You don’t need to hold everything alone.`,
      `You’re doing enough, ${name}.`
    ]
  };

  function tweak(line){
    if(level === 0) return line;
    if(level === 2) return line.replace("Small reminder", "Gentle reminder");
    return line;
  }

  function overlay(line, category){
    if(tired && (category==="meal"||category==="sleep"||category==="comfort")) return `${line} Slow is okay today.`;
    if(period && (category==="meal"||category==="sleep"||category==="comfort")) return `${line} Be extra gentle with yourself today.`;
    return line;
  }

  function gentleLine(category){
    const raw = pick(base[category] || base.comfort);
    return tweak(overlay(raw, category));
  }

  return { gentleLine };
}
