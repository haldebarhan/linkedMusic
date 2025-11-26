export const toCamelCase = (str: string): string => {
  const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (!cleanWord) return '';
      if (index === 0) {
        return cleanWord.toLowerCase();
      }
      return (
        cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase()
      );
    })
    .join('');
};
