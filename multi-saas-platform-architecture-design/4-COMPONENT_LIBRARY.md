# 4. Component Library: Reusable UI Components

Complete React component specifications for rapid tool development. All components use ShadCN/Tailwind with design system tokens.

**Philosophy:** Build components once, use across all tools. Components are styling wrappers around logic-free containers.

---

## Core Components

### **Button**

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

// Usage
<Button variant="primary" size="md">
  Upload File
</Button>

<Button variant="danger" disabled>
  Delete Account
</Button>
```

### **Input**

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  help?: string;
}

// Usage
<Input
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  error="Invalid email"
/>
```

### **Card**

```typescript
interface CardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  hover?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

// Usage
<Card title="Tool Name" description="Tool description">
  <Tool content here />
</Card>
```

### **Form**

```typescript
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
}

// Usage
<Form
  fields={[
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea' },
  ]}
  onSubmit={(data) => console.log(data)}
/>
```

### **Modal/Dialog**

```typescript
interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger';
  }[];
  children?: ReactNode;
}

// Usage
<Modal
  isOpen={isOpen}
  title="Confirm Delete"
  description="This action cannot be undone."
  actions={[
    { label: 'Cancel', onClick: () => setIsOpen(false) },
    { label: 'Delete', onClick: deleteItem, variant: 'danger' },
  ]}
/>
```

### **Tab**

```typescript
interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

// Usage
<Tabs
  items={[
    { id: 'audit', label: 'Audit Results', content: <AuditUI /> },
    { id: 'logs', label: 'Audit Logs', content: <LogsUI /> },
  ]}
  defaultTab="audit"
/>
```

### **Alert**

```typescript
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

// Usage
<Alert
  type="success"
  title="Upload Successful"
  description="Your file has been uploaded and analyzed."
/>
```

### **Badge**

```typescript
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
}

// Usage
<Badge variant="success">Compliant</Badge>
<Badge variant="error" icon={<AlertIcon />}>High Risk</Badge>
```

### **Table**

```typescript
interface TableColumn {
  key: string;
  header: string;
  render?: (value: any) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  selectable?: boolean;
  onRowClick?: (row: any) => void;
}

// Usage
<Table
  columns={[
    { key: 'filename', header: 'File Name' },
    { key: 'score', header: 'Score', render: (val) => `${val}%` },
  ]}
  data={audits}
  selectable
/>
```

### **Toast/Notification**

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage (via hook)
const { toast } = useToast();
toast({
  type: 'success',
  message: 'Audit complete!',
  duration: 3000,
});
```

### **Accordion**

```typescript
interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean; // Allow multiple open
  defaultOpen?: string[];
}

// Usage
<Accordion
  items={[
    { id: 'findings', title: 'Findings', content: <FindingsUI /> },
    { id: 'recommendations', title: 'Recommendations', content: <RecsUI /> },
  ]}
/>
```

### **ProgressBar**

```typescript
interface ProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
}

// Usage
<ProgressBar value={75} showLabel animated />
```

### **Select/Dropdown**

```typescript
interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  label?: string;
  error?: string;
}

// Usage
<Select
  label="Plan Tier"
  options={[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Professional' },
  ]}
/>
```

### **Switch/Toggle**

```typescript
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

// Usage
<Switch
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable Tool"
/>
```

### **Avatar**

```typescript
interface AvatarProps {
  src?: string;
  alt: string;
  initials?: string; // If no image
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

// Usage
<Avatar src={user.photo} alt={user.name} size="md" online />
```

### **Skeleton (Loading)**

```typescript
interface SkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
}

// Usage
{loading ? (
  <Skeleton count={3} height="40px" />
) : (
  <Content />
)}
```

### **Breadcrumb**

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

// Usage
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '/tools' },
    { label: 'Labour Auditor' },
  ]}
/>
```

---

## Layout Components

### **PageHeader**

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode; // Buttons
}

// Usage
<PageHeader
  title="Labour Code Auditor"
  description="Verify employee policies"
  actions={<Button>Upload New</Button>}
/>
```

### **PageLayout**

```typescript
interface PageLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

// Usage
<PageLayout
  header={<PageHeader ... />}
  sidebar={<ToolMenu />}
>
  <Main content />
</PageLayout>
```

### **Grid**

```typescript
interface GridProps {
  columns?: number; // responsive: { mobile: 1, tablet: 2, desktop: 3 }
  gap?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

// Usage
<Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
  <Card>...</Card>
  <Card>...</Card>
</Grid>
```

### **Stack**

```typescript
interface StackProps {
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'space-between';
  children: ReactNode;
}

// Usage
<Stack direction="row" gap="md" justify="space-between">
  <Button>Cancel</Button>
  <Button variant="primary">Submit</Button>
</Stack>
```

---

## Data Visualization

### **LineChart**

```typescript
interface ChartDataPoint {
  name: string;
  value: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string; // Uses design system color
  height?: number;
}

// Usage (via Recharts)
<LineChart data={auditsByDay} title="Audits Over Time" />
```

### **BarChart, PieChart, etc.**

Same pattern as LineChart (Recharts wrapper).

---

## Form Components (Complex)

### **FileUpload**

```typescript
interface FileUploadProps {
  accept?: string; // '.pdf,.docx'
  multiple?: boolean;
  maxSize?: number; // bytes
  onUpload: (files: File[]) => void;
  label?: string;
  description?: string;
}

// Usage
<FileUpload
  accept=".pdf,.docx"
  maxSize={10 * 1024 * 1024}
  onUpload={(files) => handleUpload(files)}
/>
```

### **DatePicker**

```typescript
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  type?: 'date' | 'month' | 'year';
}

// Usage
<DatePicker label="Select Date" onChange={setDate} />
```

### **Checkbox Group**

```typescript
interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value?: string[];
  onChange: (values: string[]) => void;
  label?: string;
}

// Usage
<CheckboxGroup
  options={[
    { value: 'labour', label: 'Labour Code' },
    { value: 'gst', label: 'GST Compliance' },
  ]}
/>
```

---

## Shared Hooks

### **useToast**

```typescript
const { toast } = useToast();

toast({
  type: 'success',
  message: 'File uploaded successfully',
  duration: 3000,
});
```

### **useQuery** (React Query)

```typescript
const { data, loading, error } = useQuery(
  ['audit-logs', userId],
  () => fetchAuditLogs(userId)
);
```

### **useMutation**

```typescript
const { mutate, loading } = useMutation(
  (file: File) => uploadFile(file),
  {
    onSuccess: () => toast({ type: 'success', message: 'Success!' }),
    onError: (err) => toast({ type: 'error', message: err.message }),
  }
);
```

### **useMediaQuery**

```typescript
const isMobile = useMediaQuery('(max-width: 640px)');

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

---

## Component Export Structure

```typescript
// components/index.ts (barrel export)
export * from './Button';
export * from './Input';
export * from './Card';
export * from './Modal';
export * from './Tab';
export * from './Alert';
// ... all components

// Usage in tools
import { Button, Card, Input, FileUpload } from '@/components';

// Or import specific
import { Button } from '@/components/Button';
```

---

## Component Implementation Tips

1. **Keep components simple** - Logic belongs in tool-specific components
2. **Use Tailwind classes** - Design system tokens via CSS variables
3. **Spread props** - Allow overrides: `<Button {...props} />`
4. **Test accessibility** - All components WCAG AA compliant
5. **Document variants** - Show all button/input variants in Storybook

---

## Storybook Setup

```bash
npm install storybook @storybook/react
npx storybook init

# Create stories/Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'danger'],
      control: 'radio',
    },
  },
};

export const Primary = (args) => <Button {...args}>Click Me</Button>;
Primary.args = { variant: 'primary' };
```

---

## Summary

This component library provides:
- ✅ 20+ reusable components
- ✅ Consistent styling across all tools
- ✅ Quick development (no CSS needed)
- ✅ Accessibility built-in
- ✅ Responsive by default

**Next:** Read FRONTEND_ARCHITECTURE.md to organize tool components.
