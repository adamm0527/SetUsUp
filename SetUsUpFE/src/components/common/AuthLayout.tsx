import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { useAuthTokenStore } from '#root/clientdata/stores';
import { ROUTES_PUBLIC } from '#root/lib/constants';
import { NavBar } from '#root/components';
import { useEndpointQuery } from '#root/api/queryHooks';
import { api_UserProfileGet } from '#root/api/endpoints';
import AcceptLegalGate from '#root/components/legal/AcceptLegalGate';


export default function AuthLayout() {
  const { token } = useAuthTokenStore(); // (try) getting auth token from zustand store
  const navigate = useNavigate();  // used for navigating to login page in case auth fails

  useEffect(() => {
    if (!token) // if no token exists, redirect to login page
      navigate({ to: ROUTES_PUBLIC.get('LOGIN') });
    
    // if token exists but expired/invalid, axios will soon handle it (in response to 4xx redirects to login)
  }, [token]);

  /* Profile is fetched here for BOTH to the legal gate AND to the NavBar avatar without a duplicate request.
     Both call useEndpointQuery with the same ['user', 'profile'] key, so React Query dedups them,
     guarded on `enabled: !!token` so we don't attempt the call before login. */
  const profileQuery = useEndpointQuery(
    ['user', 'profile'],
    api_UserProfileGet,
    undefined,
    { enabled: !!token }
  );
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;

  if (!token)
    return null; // don't render anything until we have a token

  return (
    <>
      <NavBar/>
      <Outlet/>
      {profile && <AcceptLegalGate acceptedVersion={profile.acceptedLegalVersion} />}
    </>
  );
}
