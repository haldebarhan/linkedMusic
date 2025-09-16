export const formatLabel = (slug: string) => {
  let label: string;
  switch (slug) {
    case 'musiciens':
      label = 'Je suis';
      break;
    default:
      label = 'Rubrique';
      break;
  }
  return label;
};
