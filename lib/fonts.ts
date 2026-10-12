import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { NotoSansHebrew_500Medium, NotoSansHebrew_700Bold } from '@expo-google-fonts/noto-sans-hebrew';
import { useFonts } from 'expo-font';

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    NotoSansHebrew_500Medium,
    NotoSansHebrew_700Bold,
  });
  return loaded;
}
