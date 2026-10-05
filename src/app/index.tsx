import { ImageCard } from '@/components/ImageCard';
import { NoteCard } from '@/components/NoteCard';
import { QuoteCard } from '@/components/QuoteCard';
import { RedditCard } from '@/components/RedditCard';
import { TweetCard } from '@/components/TweetCard';
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

            <RedditCard
              subredditAvatar="https://styles.redditmedia.com/t5_38nds/styles/communityIcon_gisj6ovi5z6e1.png?width=96&height=96&frame=1&auto=webp&s=0d0d70a2dccf65fa9374160882dc3ab2496890b1"
              subredditName="r/FilosofiaBR"
              postTitle="Existe algo muito interessante na ideia de Spinoza, o maior erro que cometemos ao pensar em Deus seja imaginar que ele precisa estar fora de tudo"
              text="Spinoza propõe uma ideia muito mais difícil de imaginar, Deus e natureza não seriam duas coisas diferentes. Deus seria a própria existência. Não estaria apenas criando o mundo, mas se manifestando através dele. Tudo aquilo que existe faria parte desse mesmo todo. Isso muda completamente a maneira de olhar para nós mesmos. Porque, se somos parte da natureza, então não estamos simplesmente vivendo dentro de um universo que existe separado de nós. Nós somos uma expressão dele"
              image="https://cf.preview.redd.it/existe-algo-muito-interessante-na-ideia-de-spinoza-o-maior-v0-th3lbt1r12th1.jpeg?auto=webp&s=cd1a58f867d75ab541e6245da99f535a0eea65c1"
            />
          </View>

          {/* Right Column */}
          <View className="flex-1 gap-4">
            <QuoteCard text="Alguns vivem como se nunca fossem viver, outros morrem como se nunca tivessem vivido. Eu não vivo em vão, eu vivo pra ser feliz, eu não vivo pra ser normal. Sou Charlie Brown, mané!" />
            <TweetCard
              avatar="https://pbs.twimg.com/profile_images/2096296808729186306/YPFTW33c_400x400.jpg"
              author="nostalgia & history"
              text="tobacco company ceo’s declaring, under oath, that nicotine isn't addictive (1994)"
              images={['https://pbs.twimg.com/media/HTot854XIAAUCVF?format=jpg&name=small']}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
