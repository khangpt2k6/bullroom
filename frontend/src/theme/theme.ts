import { MD3LightTheme } from 'react-native-paper';
import {
  USF_GREEN,
  USF_GREEN_LIGHT,
  USF_GREEN_DARK,
  USF_GREEN_LIGHTEST,
  USF_GOLD,
  USF_GOLD_LIGHT,
  USF_GOLD_LIGHTEST
} from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: USF_GREEN,
    primaryContainer: USF_GREEN_LIGHT,
    secondary: USF_GOLD,
    secondaryContainer: USF_GOLD_LIGHT,
    tertiary: USF_GREEN_DARK,
    background: USF_GREEN_LIGHTEST,
    surface: '#FFFFFF',
    surfaceVariant: USF_GOLD_LIGHTEST,
    error: '#D32F2F',
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: USF_GREEN_DARK,
    onSecondary: '#000000',
    onSecondaryContainer: '#000000',
    onBackground: '#1C1B1F',
    onSurface: '#1C1B1F',
    onSurfaceVariant: USF_GREEN,
    outline: USF_GOLD_LIGHT,
    outlineVariant: USF_GOLD_LIGHTEST,
    shadow: USF_GREEN_DARK,
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F7F7F7',
      level3: '#F0F0F0',
      level4: '#EFEFEF',
      level5: '#EDEDED',
    },
  },
  roundness: 12,
};

export type AppTheme = typeof theme;
