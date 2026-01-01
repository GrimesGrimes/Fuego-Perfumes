import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        // Si navegas a un hash (#iconicas), dejamos que el browser haga el scroll al anchor
        if (hash) return;

        // Fuerza ir al inicio en cada cambio de ruta/params
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname, search, hash]);

    return null;
}
