
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { i18n } = useLanguage();
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{i18n.home}</Text>
      <Text style={[styles.text, { color: colors.placeholder }]}>{i18n.coming_soon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
  },
});
