import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// Nobody plays without an alias: it identifies the player in the ranking and for the prizes.
// Anyone who gets here without one (a direct link, a cleared storage) goes to the start screen.
export default function RequireAlias({ children }: { children: ReactNode }) {
    return localStorage.getItem('playerId') ? <>{children}</> : <Navigate to="/" replace />;
}
