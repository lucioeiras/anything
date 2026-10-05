import { ImageCard } from '@/components/ImageCard';
import { NoteCard } from '@/components/NoteCard';
import { QuoteCard } from '@/components/QuoteCard';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start gap-4">
          {/* Left Column */}
          <View className="flex-1 gap-4">
            <NoteCard
              text="Lorem ipsum dolor sit amet consectetur. Nisl interdum in dictumst quis id eu tincidunt. Aliquet dui lacus risus vel quis at morbi. Eget sed arcu a nulla purus. Erat elementum diam tempus lacus pharetra."
              title="Sample Note"
            />

            <ImageCard
              url="https://i.pinimg.com/736x/83/04/81/830481a78d2d7823a9cd9a162e3134aa.jpg"
              title="Sample Image"
            />
          </View>

          {/* Right Column */}
          <View className="flex-1 gap-4">
            <QuoteCard text="Alguns vivem como se nunca fossem viver, outros morrem como se nunca tivessem vivido. Eu não vivo em vão, eu vivo pra ser feliz, eu não vivo pra ser normal. Sou Charlie Brown, mané!" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
