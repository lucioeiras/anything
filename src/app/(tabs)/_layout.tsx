import { Tabs } from 'expo-router';
import { NutIcon, PlusIcon, SquaresFourIcon } from 'phosphor-react-native';

const iconSize = 28;

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="board"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6', // tailwind blue-500
        tabBarInactiveTintColor: '#fff', // tailwind zinc-500
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingHorizontal: 20,
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
              weight={focused ? 'fill' : 'light'}
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
