import {
  Card,
  CardProps,
  DefaultMantineColor,
  createPolymorphicComponent,
  useMantineTheme,
  createStyles,
} from '@mantine/core';
import { getRandom } from '~/utils/array-helpers';
import { forwardRef, useMemo } from 'react';

type MasonryCardProps = CardProps & { height?: number };

const _MasonryCard = forwardRef<HTMLDivElement, MasonryCardProps>(
  ({ height, children, style, ...props }, ref) => {
    const theme = useMantineTheme();

    const background = useMemo(() => {
      const base = theme.colors[getRandom(mantineColors)];
      const color = theme.colorScheme === 'dark' ? theme.colors.dark[6] : '#fff';
      return theme.fn.gradient({ from: base[9], to: color, deg: 180 });
    }, [theme]);

    return (
      <Card
        ref={ref}
        style={{
          background,
          height,
          ...style,
        }}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
_MasonryCard.displayName = 'MasonryCard';

export const MasonryCard = createPolymorphicComponent<'div', MasonryCardProps>(_MasonryCard);

const mantineColors: DefaultMantineColor[] = [
  'blue',
  'cyan',
  'grape',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'teal',
  'violet',
  'yellow',
];