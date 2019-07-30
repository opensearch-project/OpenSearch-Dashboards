/* eslint-disable import/no-unresolved */
// @ts-ignore
import themeDark from '../src/theme_dark.scss?lazy';
// @ts-ignore
import themeLight from '../src/theme_light.scss?lazy';

export function switchTheme(theme: string) {
  switch (theme) {
    case 'light':
      themeDark.unuse();
      themeLight.use();
      return;
    case 'dark':
      themeLight.unuse();
      themeDark.use();
      return;
  }
}
