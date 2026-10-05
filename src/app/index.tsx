import { Note } from '@/components/Note';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start gap-4">
          {/* Left Column */}
          <View className="flex-1 gap-4">
            <Note
              text="Lorem ipsum dolor sit amet consectetur. Nisl interdum in dictumst quis id eu tincidunt. Aliquet dui lacus risus vel quis at morbi. Eget sed arcu a nulla purus. Erat elementum diam tempus lacus pharetra."
              title="Sample Note"
            />
          </View>

          {/* Right Column */}
          <View className="flex-1 gap-4"></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
