import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = { args: { checked: false } };
export const On: Story = { args: { checked: true } };
export const Disabled: Story = { args: { checked: false, disabled: true } };
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="s1" />
      <Label htmlFor="s1">Enable feature</Label>
    </div>
  ),
};
