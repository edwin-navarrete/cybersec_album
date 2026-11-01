import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import RequireAlias from './RequireAlias';

function renderAt(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/" element={<p>start screen</p>} />
                <Route path="/album" element={<RequireAlias><p>album</p></RequireAlias>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('RequireAlias', () => {
    beforeEach(() => localStorage.clear());

    it('sends a player without an alias to the start screen', () => {
        renderAt('/album');

        expect(screen.getByText('start screen')).toBeTruthy();
        expect(screen.queryByText('album')).toBeNull();
    });

    it('lets in a player who has an alias', () => {
        localStorage.setItem('playerId', '7');

        renderAt('/album');

        expect(screen.getByText('album')).toBeTruthy();
    });
});
