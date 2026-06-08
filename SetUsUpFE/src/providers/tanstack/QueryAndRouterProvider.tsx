/* Provider for both Tanstack Query and Router */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import routeTree from './routeTree.ts';
import RealTimeProvider from '#root/api/realtime/RealTimeProvider.tsx';

/* single, shared query client */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

/* creating the router (reuses the shared query client) */
export const Router = createRouter({
  routeTree,
  context: { queryClient }
});

/* required for TS IntelliSense */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof Router
  }
}

export default function QueryAndRouterProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealTimeProvider>
        <RouterProvider router={Router}/>
      </RealTimeProvider>
    </QueryClientProvider>
  );
}
