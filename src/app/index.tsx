import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Rocket, ShootingStar, Planet } from 'phosphor-react-native';

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-black p-6">
      <View className="flex-row gap-4 mb-8">
        <Planet color="#fff" size={48} weight="duotone" />
        <Rocket color="#fff" size={48} weight="fill" />
        <ShootingStar color="#fff" size={48} weight="light" />
      </View>

      <Text className="text-white text-3xl font-sans mb-4">Instrument Sans</Text>
      <Text className="text-white text-2xl font-sans-medium mb-4">Medium Weight</Text>
      <Text className="text-white text-2xl font-sans-bold mb-4">Bold Weight</Text>
      <Text className="text-white text-2xl font-serif-italic">Instrument Serif Italic</Text>
    </SafeAreaView>
  );
}
