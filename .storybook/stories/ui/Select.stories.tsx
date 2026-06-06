import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">浅色 (Light)</SelectItem>
        <SelectItem value="dark">深色 (Dark)</SelectItem>
        <SelectItem value="system">跟随系统</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-1.5">
      <Label>主题</Label>
      <Select>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="选择主题..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">浅色 (Light)</SelectItem>
          <SelectItem value="dark">深色 (Dark)</SelectItem>
          <SelectItem value="system">跟随系统</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
