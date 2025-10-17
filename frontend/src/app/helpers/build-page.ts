export const buildPages = (current: number, last: number) => {
  const max = 5;
  let start = Math.max(1, current - Math.floor(max / 2));
  let end = Math.min(last, start + max - 1);
  start = Math.max(1, end - max + 1);
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
};
