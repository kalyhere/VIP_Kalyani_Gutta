# Performance Monitoring Hooks and Utilities

This directory contains React hooks and components for monitoring and debugging component performance in the AIMMS Web Platform.

## Available Tools

### 1. `useRenderCount`

Tracks how many times a component has rendered. Useful for identifying components that re-render unnecessarily.

```tsx
import { useRenderCount } from '@hooks/performance/useRenderCount';

function MyComponent() {
  useRenderCount('MyComponent');
  return <div>Content</div>;
}
```

**Output (Development only):**
```
[Render Count] MyComponent: 1
[Render Count] MyComponent: 2
[Render Count] MyComponent: 3
```

### 2. `useWhyDidYouUpdate`

Debugs why a component re-rendered by logging which props changed.

```tsx
import { useWhyDidYouUpdate } from '@hooks/performance/useWhyDidYouUpdate';

function MyComponent(props) {
  useWhyDidYouUpdate('MyComponent', props);
  return <div>{props.value}</div>;
}
```

**Output (Development only):**
```
[Why Did You Update] MyComponent {
  value: { from: 'old', to: 'new' }
}
```

### 3. `withPerformanceLogging`

Higher-Order Component (HOC) that logs render times.

```tsx
import { withPerformanceLogging } from '@hooks/performance/withPerformanceLogging';

const MyComponent = ({ data }) => <div>{data}</div>;

export default withPerformanceLogging(MyComponent, 'MyComponent');
```

**Output (Development only):**
```
[Performance] MyComponent rendered in 2.34ms
```

### 4. `PerformanceProfiler`

React Profiler wrapper for detailed performance monitoring. Works in both development and production.

```tsx
import { PerformanceProfiler } from '@hooks/performance/PerformanceProfiler';

function App() {
  return (
    <PerformanceProfiler id="Dashboard" logToConsole={true}>
      <Dashboard />
    </PerformanceProfiler>
  );
}
```

**Custom callback example:**
```tsx
<PerformanceProfiler
  id="MyComponent"
  logToConsole={false}
  onRender={(id, phase, actualDuration) => {
    // Send to analytics service
    analytics.track('component_render', {
      component: id,
      phase,
      duration: actualDuration,
    });
  }}
>
  <MyComponent />
</PerformanceProfiler>
```

## Best Practices

### When to Use Each Tool

- **`useRenderCount`**: Quick check for excessive re-renders during development
- **`useWhyDidYouUpdate`**: Deep debugging when you know a component is re-rendering unnecessarily
- **`withPerformanceLogging`**: Measure render times for specific components
- **`PerformanceProfiler`**: Production-ready monitoring or measuring component trees

### Performance Optimization Workflow

1. **Identify** - Use `useRenderCount` to find components that render frequently
2. **Debug** - Use `useWhyDidYouUpdate` to see what's causing re-renders
3. **Fix** - Apply optimizations (React.memo, useMemo, useCallback)
4. **Validate** - Use `withPerformanceLogging` or `PerformanceProfiler` to confirm improvements

### Common Fixes for Unnecessary Re-renders

```tsx
// Problem: Component re-renders when parent re-renders
const ExpensiveComponent = (props) => { /* ... */ };

// Solution: Wrap with React.memo
const OptimizedComponent = React.memo(ExpensiveComponent);

// Problem: Inline function props cause re-renders
function Parent() {
  return <Child onClick={() => handleClick()} />;
}

// Solution: Use useCallback
function Parent() {
  const handleClick = useCallback(() => {
    // handler logic
  }, [/* dependencies */]);

  return <Child onClick={handleClick} />;
}

// Problem: Expensive computation runs on every render
function Component({ data }) {
  const processedData = expensiveOperation(data);
  return <div>{processedData}</div>;
}

// Solution: Use useMemo
function Component({ data }) {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  );
  return <div>{processedData}</div>;
}
```

## Integration with React DevTools

These utilities complement the [React DevTools Profiler](https://react.dev/learn/react-developer-tools):

1. Install React DevTools browser extension
2. Open DevTools and navigate to "Profiler" tab
3. Click "Record" and interact with your app
4. Analyze the flame graph to identify slow components
5. Use these hooks to add instrumentation to specific components

## Production Considerations

- `useRenderCount` and `useWhyDidYouUpdate` only log in development mode
- `withPerformanceLogging` only logs in development mode
- `PerformanceProfiler` works in production but set `logToConsole={false}` and use custom `onRender` callback for analytics

## Further Reading

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [React Profiler API](https://react.dev/reference/react/Profiler)
- [Optimizing Performance](https://react.dev/learn/render-and-commit#optimizing-performance)
