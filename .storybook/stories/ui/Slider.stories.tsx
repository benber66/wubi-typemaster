import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <Slider defaultValue={[50]} max={100} step={1} className="w-60" />,
};

export const VolumeControl: Story = {
  render: () => {
    const [v, setV] = useState(0.7);
    return (
      <div className="w-60 space-y-2">
        <div className="flex justify-between text-sm">
          <Label>音量</Label>
          <span className="text-muted-foreground">{Math.round(v * 100)}%</span>
        </div>
        <Slider
          value={[v]}
          onValueChange={(arr) => setV(arr[0] ?? 0)}
          min={0}
          max={1}
          step={0.05}
        />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => <Slider defaultValue={[20, 80]} max={100} step={1} className="w-60" />,
};
