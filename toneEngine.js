export function tonePrefix(level=1){
  const L = Number(level || 1);
  if(L === 0) return "Calm";
  if(L === 2) return "Warm";
  return "Soft";
}
