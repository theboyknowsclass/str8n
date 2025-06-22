import { Text, useFont } from '@shopify/react-native-skia';

interface LogoTextProps {
  scale: number;
  background: string;
}

export const LogoText = ({ scale, background }: LogoTextProps) => {
  const fontPosition = { x: 250, y: 525 };
  const fontSize = 130;

  const font = useFont(
    require('@assets/Orbitron_500Medium.ttf'),
    fontSize * scale
  );

  return (
    <Text
      x={fontPosition.x * scale}
      y={fontPosition.y * scale}
      text="STR8N"
      font={font}
      color={background}
    />
  );
};
