export const getIcon = (slug: string) => {
  let iconClass: string;
  switch (slug) {
    case 'musiciens':
      iconClass = 'fas fa-music';
      break;
    case 'instruments':
      iconClass = 'fa-solid fa-guitar';
      break;
    case 'cours':
      iconClass = 'fa-solid fa-chalkboard';
      break;
    case 'professionnels':
      iconClass = 'fas fa-chalkboard-teacher';
      break;
    case 'studios':
      iconClass = 'fas fa-microphone';
      break;
    case 'divers':
      iconClass = 'fa-solid fa-sliders';
      break;
    default:
      iconClass = 'fas fa-music';
      break;
  }
  return iconClass;
};
