import { Colors } from './colors';

export const Shadows = {
  card: {
    shadowColor  : '#000000',
    shadowOffset : { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius : 12,
    elevation    : 3,
  },
  button: {
    shadowColor  : Colors.primary,
    shadowOffset : { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius : 12,
    elevation    : 6,
  },
  float: {
    shadowColor  : '#000000',
    shadowOffset : { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius : 20,
    elevation    : 10,
  },
};
