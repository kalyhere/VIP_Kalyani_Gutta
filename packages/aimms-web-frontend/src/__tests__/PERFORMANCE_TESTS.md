# Performance Testing Guide

This directory contains performance tests and guidelines for the AIMMS Web Platform.

## Running Performance Tests

### 1. Bundle Size Tests
```bash
npm run test:bundle
```
This will:
- Build the production bundle
- Run bundle size regression tests
- Verify code splitting, compression, and size budgets

### 2. Full Performance Suite
```bash
npm run test:performance
```
This will:
- Run bundle size tests
- Generate and open visual bundle analysis report

### 3. Bundle Analysis (Visual Report)
```bash
npm run analyze:bundle
```
This will:
- Build the production bundle
- Generate a visual report (stats.html)
- Open the report in your browser

### 4. Quick Size Check
```bash
npm run check:sizes
```
This will:
- Build the production bundle
- Display file sizes for all JS bundles and their compressed versions

## Performance Budgets

Current performance budgets configured in `.lighthouserc.json`:

| Metric | Budget | Description |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Time until first content is visible |
| Largest Contentful Paint (LCP) | < 2.5s | Time until main content is visible |
| Time to Interactive (TTI) | < 3.5s | Time until page is fully interactive |
| Total Blocking Time (TBT) | < 300ms | Total time the main thread was blocked |
| Cumulative Layout Shift (CLS) | < 0.1 | Measure of visual stability |
| Bundle Size | < 500KB | Maximum total bundle size |
| Initial Chunk | < 200KB | Size of main entry chunk |

## Performance Testing Workflow

### 1. Baseline Measurement
Before making changes:
```bash
# Build and measure current performance
npm run build
npm run test:performance
```

Save the results for comparison.

### 2. Make Optimizations
Apply performance improvements:
- Add code splitting
- Optimize components with React.memo
- Use useMemo/useCallback
- Compress assets

### 3. Measure Impact
After changes:
```bash
# Build and measure new performance
npm run build
npm run test:performance
```

### 4. Compare Results
Look for improvements in:
- Bundle size reduction
- Faster load times (FCP, LCP)
- Better interactivity (TTI, TBT)
- Fewer chunks or better chunk distribution

## Performance Profiling

### React DevTools Profiler

1. Install [React DevTools](https://react.dev/learn/react-developer-tools)
2. Open browser DevTools → Profiler tab
3. Click "Record" button
4. Interact with the application
5. Stop recording
6. Analyze the flame graph

**What to look for:**
- Components taking >16ms to render (causes dropped frames)
- Components re-rendering unnecessarily
- Large component trees

### Chrome Performance Tab

1. Open Chrome DevTools → Performance tab
2. Click "Record" button
3. Perform user actions
4. Stop recording
5. Analyze the timeline

**What to look for:**
- Long tasks (>50ms)
- Excessive JavaScript execution
- Layout thrashing
- Network bottlenecks

## Critical User Flows to Test

Test these user journeys for performance:

### 1. Initial Load
```
1. Open application URL
2. Measure: FCP, LCP, TTI
3. Goal: < 2.5s LCP on desktop, < 4s on mobile
```

### 2. Dashboard Navigation
```
1. Login as student/faculty/admin
2. Navigate to dashboard
3. Measure: Time to interactive
4. Goal: < 1s navigation time
```

### 3. Report Viewing
```
1. Navigate to report history
2. Open a report
3. Measure: Report load time
4. Goal: < 2s to display report
```

### 4. MCC Form Building
```
1. Open MCC form builder
2. Add/edit form elements
3. Measure: Interaction responsiveness
4. Goal: < 100ms interaction response
```

## Network Throttling Tests

Test performance on slower connections:

```bash
# In Chrome DevTools:
# Network tab → Throttling → Fast 3G or Slow 3G
```

Expected behavior:
- App remains usable on Fast 3G
- Critical content loads first
- Non-critical content deferred
- Loading states shown appropriately

## Performance Regression Prevention

### CI/CD Integration
The Lighthouse CI will run automatically on:
- Pull requests
- Merges to main branch

If performance budgets are exceeded:
- ❌ Build will fail
- 📊 Report will be attached to PR
- 🔍 Review required before merge

### Local Checks
Before committing performance changes:
```bash
# 1. Run bundle analysis
npm run analyze:bundle

# 2. Check bundle size
npm test performance-tests/

# 3. Run Lighthouse
npm run test:performance
```

## Common Performance Issues

### Issue 1: Large Bundle Size
**Symptoms:** Slow initial load
**Solutions:**
- Enable code splitting
- Lazy load routes
- Remove unused dependencies
- Use dynamic imports

### Issue 2: Slow Component Renders
**Symptoms:** Laggy interactions, low FPS
**Solutions:**
- Add React.memo to frequently re-rendering components
- Use useMemo for expensive computations
- Use useCallback for event handlers
- Profile with React DevTools

### Issue 3: Network Waterfall
**Symptoms:** Sequential resource loading
**Solutions:**
- Preload critical resources
- Use HTTP/2 server push
- Optimize image sizes
- Enable compression

### Issue 4: Large Images
**Symptoms:** Slow content loading
**Solutions:**
- Convert to WebP format
- Resize to display dimensions
- Use lazy loading
- Implement responsive images

## Performance Optimization Checklist

Before marking a feature as "performance optimized":

- [ ] Lighthouse score ≥ 90
- [ ] Bundle size under budget
- [ ] Code splitting implemented
- [ ] Critical components memoized
- [ ] Images optimized and lazy loaded
- [ ] No unnecessary re-renders (verified with React Profiler)
- [ ] Fast 3G test passed
- [ ] Performance tests passing in CI

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
