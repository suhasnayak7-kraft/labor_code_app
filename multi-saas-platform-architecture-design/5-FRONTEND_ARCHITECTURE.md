# 5. Frontend Architecture: React Organization & Tool Loading

How to organize React codebase for rapid multi-tool development with minimal code duplication.

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/              # Shared component library
│   │   ├── ui/                 # Low-level UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── layouts/            # Page layouts
│   │   │   ├── PageLayout.tsx
│   │   │   ├── ToolLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── common/             # Cross-app shared components
│   │   │   ├── Header.tsx      # Top navigation
│   │   │   ├── UserProfile.tsx
│   │   │   ├── ToolHub.tsx     # Tool selection
│   │   │   └── AdminDashboard.tsx
│   │   └── index.ts            # Barrel export
│   │
│   ├── tools/                  # Tool modules (self-contained)
│   │   ├── labour-auditor/
│   │   │   ├── LabourAuditor.tsx     # Main tool component
│   │   │   ├── components/
│   │   │   │   ├── UploadForm.tsx
│   │   │   │   ├── ResultsDisplay.tsx
│   │   │   │   └── AuditHistory.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAudit.ts       # Tool-specific logic
│   │   │   │   └── useAuditStatus.ts
│   │   │   ├── services/
│   │   │   │   └── api.ts            # Tool endpoints
│   │   │   ├── types/
│   │   │   │   └── index.ts          # Tool-specific types
│   │   │   └── index.ts
│   │   │
│   │   ├── gst-checker/
│   │   │   ├── GstChecker.tsx
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   └── ...other tools
│   │
│   ├── hooks/                  # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useQuery.ts         # React Query wrapper
│   │   ├── useMutation.ts
│   │   └── useToast.ts
│   │
│   ├── services/               # Shared services
│   │   ├── auth.ts             # Supabase auth
│   │   ├── api.ts              # Shared API utilities
│   │   ├── supabase.ts         # Supabase client
│   │   └── analytics.ts        # Event tracking
│   │
│   ├── types/                  # Shared types
│   │   ├── common.ts           # User, Profile, etc.
│   │   ├── api.ts              # API response types
│   │   └── database.ts         # DB table types
│   │
│   ├── utils/                  # Utility functions
│   │   ├── format.ts           # String formatting
│   │   ├── validation.ts       # Form validation
│   │   ├── storage.ts          # Local storage helpers
│   │   └── constants.ts        # Shared constants
│   │
│   ├── config/                 # Configuration
│   │   ├── env.ts              # Environment variables
│   │   ├── tools.ts            # Tool registry
│   │   └── theme.ts            # Design tokens
│   │
│   ├── App.tsx                 # Root component (tool switcher)
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles (Tailwind)
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## App.tsx: Root Component (Tool Hub)

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/common/Header';
import { ToolHub } from '@/components/common/ToolHub';
import { AdminDashboard } from '@/components/common/AdminDashboard';
import { tools } from '@/config/tools';

// Tool imports (lazy load for performance)
import { LabourAuditor } from '@/tools/labour-auditor';
import { GstChecker } from '@/tools/gst-checker';

export function App() {
  const { user, isLoading } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (isLoading) return <Skeleton count={3} />;
  if (!user) return <LoginPage />;

  // Admin view
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <AdminDashboard activeTab={activeTool} onTabChange={setActiveTool} />
      </div>
    );
  }

  // User view
  if (!activeTool) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onProfileClick={() => {}} />
        <ToolHub
          tools={tools}
          userPlan={user.subscription_tier_id}
          onSelectTool={(toolSlug) => setActiveTool(toolSlug)}
        />
      </div>
    );
  }

  // Render selected tool
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <ToolLayout onBack={() => setActiveTool(null)}>
        {activeTool === 'labour-auditor' && <LabourAuditor />}
        {activeTool === 'gst-checker' && <GstChecker />}
        {/* Add more tools here */}
      </ToolLayout>
    </div>
  );
}
```

---

## Tool Module: Labour Auditor Example

### **LabourAuditor.tsx** (Main component)

```typescript
import { useState } from 'react';
import { useAudit } from './hooks/useAudit';
import { Card, Tabs, Button } from '@/components';
import { UploadForm } from './components/UploadForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AuditHistory } from './components/AuditHistory';

export function LabourAuditor() {
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
  const { audit, isLoading, error, results } = useAudit();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Labour Code Auditor</h1>
        <p className="text-gray-600">Verify employee policies for compliance</p>
      </div>

      <Tabs
        items={[
          {
            id: 'audit',
            label: 'New Audit',
            content: (
              <Card>
                <UploadForm onSubmit={audit} loading={isLoading} />
                {error && <Alert type="error">{error}</Alert>}
                {results && <ResultsDisplay results={results} />}
              </Card>
            ),
          },
          {
            id: 'history',
            label: 'Audit History',
            content: <AuditHistory />,
          },
        ]}
        defaultTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'audit' | 'history')}
      />
    </div>
  );
}
```

### **hooks/useAudit.ts** (Tool-specific logic)

```typescript
import { useState } from 'react';
import { useMutation } from '@/hooks/useMutation';
import { auditPolicy } from './services/api';

interface AuditResults {
  compliance_score: number;
  findings: string[];
  model_id: string;
  response_time_ms: number;
}

export function useAudit() {
  const [results, setResults] = useState<AuditResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isLoading } = useMutation(
    async (file: File) => {
      const response = await auditPolicy(file);
      return response;
    },
    {
      onSuccess: (data) => {
        setResults(data);
        setError(null);
      },
      onError: (err: Error) => {
        setError(err.message);
        setResults(null);
      },
    }
  );

  return {
    audit: mutate,
    isLoading,
    error,
    results,
  };
}
```

### **services/api.ts** (Tool endpoints)

```typescript
// /tools/labour-auditor/audit
export async function auditPolicy(file: File): Promise<AuditResults> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/tools/labour-auditor/audit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  return response.json();
}

// /tools/labour-auditor/status
export async function checkStatus() {
  const response = await fetch('/api/tools/labour-auditor/status', {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return response.json();
}

// /tools/labour-auditor/logs
export async function getAuditLogs(userId: string) {
  const response = await fetch(`/api/tools/labour-auditor/logs?user_id=${userId}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return response.json();
}
```

### **components/UploadForm.tsx**

```typescript
import { useState } from 'react';
import { FileUpload, Button, Alert } from '@/components';

interface UploadFormProps {
  onSubmit: (file: File) => Promise<void>;
  loading: boolean;
}

export function UploadForm({ onSubmit, loading }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      await onSubmit(file);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        accept=".pdf,.docx"
        maxSize={50 * 1024 * 1024}
        onUpload={(files) => {
          setFile(files[0]);
          setError(null);
        }}
        label="Upload Company Policy"
        description="PDF or Word document, max 50MB"
      />

      {file && (
        <Alert type="info">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
        </Alert>
      )}

      {error && <Alert type="error">{error}</Alert>}

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!file || loading}
        loading={loading}
      >
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </Button>
    </div>
  );
}
```

---

## Shared Hooks

### **hooks/useAuth.ts**

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { User, Profile } from '@/types/common';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          setUser(profile);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, isLoading, error };
}
```

### **hooks/useQuery.ts** (Wrapper around React Query)

```typescript
import { useQuery as useRQQuery } from '@tanstack/react-query';

export function useQuery<T>(
  key: string[],
  fn: () => Promise<T>,
  options?: any
) {
  const { data, isLoading, error, refetch } = useRQQuery({
    queryKey: key,
    queryFn: fn,
    ...options,
  });

  return {
    data,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

---

## Tool Registry

### **config/tools.ts**

```typescript
export interface ToolConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  minPlan: string;
  component: React.ComponentType;
}

export const tools: ToolConfig[] = [
  {
    slug: 'labour-auditor',
    name: 'Labour Code Auditor',
    description: 'Verify employee policies for compliance',
    icon: '📋',
    category: 'Compliance',
    minPlan: 'free',
    component: LabourAuditor,
  },
  {
    slug: 'gst-checker',
    name: 'GST Compliance Checker',
    description: 'Verify GST filings and compliance',
    icon: '📊',
    category: 'Tax',
    minPlan: 'pro',
    component: GstChecker,
  },
  // Add more tools here
];

export function getToolsByPlan(planTier: string): ToolConfig[] {
  const tierRanking = { free: 0, pro: 1, business: 2, enterprise: 3 };
  const userRank = tierRanking[planTier] || 0;

  return tools.filter((tool) => {
    const toolRank = tierRanking[tool.minPlan] || 0;
    return userRank >= toolRank;
  });
}
```

---

## State Management

**Use React Query for server state, local state for UI:**

```typescript
// Server state (cached, refetched)
const { data: audits } = useQuery(['audits', userId], () => fetchAudits(userId));

// UI state (local)
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState('audit');
```

**Avoid Redux/Zustand for this architecture.**

---

## Code Sharing Tips

1. **Share components** - Put in `/components` folder
2. **Share hooks** - Put in `/hooks` folder
3. **Share services** - Put in `/services` folder
4. **Keep tools isolated** - Tool-specific code in `/tools/{tool}/`
5. **Use barrel exports** - `export * from './Button'` in index.ts

---

## Build Optimization

```javascript
// vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'recharts'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['@/components'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

---

## Summary

This architecture ensures:
- ✅ Tools are self-contained modules
- ✅ Shared code in `/components`, `/hooks`, `/services`
- ✅ No cross-tool dependencies
- ✅ Easy to add new tools (copy folder, change logic)
- ✅ Clean separation of concerns

**Next:** Read BACKEND_ARCHITECTURE.md for FastAPI organization.
