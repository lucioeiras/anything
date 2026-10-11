import { Tabs } from 'expo-router';
import { NutIcon, PlusIcon, SquaresFourIcon, TagIcon } from 'phosphor-react-native';

const iconSize = 28;

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="board"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF', // tailwind blue-500
        tabBarInactiveTintColor: '#71717B', // tailwind zinc-500
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopWidth: 1,
          borderTopColor: '#27272a',
          elevation: 0,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'InstrumentSans_700Bold',
          fontSize: 10,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="board"
        options={{
          title: 'Board',
          tabBarIcon: ({ color, focused }) => (
            <SquaresFourIcon
              size={iconSize}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarIcon: ({ color, focused }) => (
            <TagIcon
              size={iconSize - 4}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <PlusIcon size={iconSize} color={color as string} weight={focused ? 'fill' : 'bold'} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <NutIcon
              size={iconSize}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
